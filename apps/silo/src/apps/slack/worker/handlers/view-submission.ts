import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { ContentParser } from "@plane/etl/parser";
import { SlackService, TSlackIssueEntityData, TViewSubmissionPayload } from "@plane/etl/slack";
import { Client, ExIssue, ExIssuePropertyValue, IssueWithExpanded, PlaneUser } from "@plane/sdk";
import { TWorkspaceConnection } from "@plane/types";
import { env } from "@/env";
import { CONSTANTS } from "@/helpers/constants";
import { downloadFile } from "@/helpers/utils";
import { logger } from "@/logger";
import { APIClient, getAPIClient } from "@/services/client";
import { getConnectionDetails } from "../../helpers/connection-details";
import { ENTITIES } from "../../helpers/constants";
import { getSlackContentParser } from "../../helpers/content-parser";
import { createSlackFormParser } from "../../helpers/field-parser/field-parser";
import { parseLinkWorkItemFormData } from "../../helpers/parse-issue-form";
import { getSlackThreadUrl } from "../../helpers/urls";
import { enhanceUserMapWithSlackLookup, getUserMapFromSlackWorkspaceConnection } from "../../helpers/user";
import { TIntakeFormResult, TWorkItemFormResult } from "../../types/fields";
import {
  E_MESSAGE_ACTION_TYPES,
  ShortcutActionPayload,
  SlackPrivateMetadata,
  TSlackConnectionDetails,
} from "../../types/types";
import { createSlackIntakeLinkback } from "../../views/intake-linkback";
import { createSlackLinkback } from "../../views/issue-linkback";
import { createLinkIssueModalView } from "../../views/link-issue-modal";

const apiClient = getAPIClient();

export const handleViewSubmission = async (data: TViewSubmissionPayload) => {
  const details = await getConnectionDetails(data.team.id, {
    id: data.user.id,
  });
  if (!details) {
    logger.info(`[SLACK] No connection details found for team ${data.team.id}`);
    return;
  }

  switch (data.view.callback_id) {
    case E_MESSAGE_ACTION_TYPES.LINK_WORK_ITEM:
      return await handleLinkWorkItemViewSubmission(details, data);
    case E_MESSAGE_ACTION_TYPES.DISCONNECT_WORK_ITEM:
      return await handleDisconnectWorkItemViewSubmission(details, data);
    case E_MESSAGE_ACTION_TYPES.ISSUE_COMMENT_SUBMISSION:
      return await handleIssueCommentViewSubmission(details, data);
    case E_MESSAGE_ACTION_TYPES.ISSUE_WEBLINK_SUBMISSION:
      return await handleIssueWeblinkViewSubmission(details, data);
    case E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM:
    case E_MESSAGE_ACTION_TYPES.CREATE_INTAKE_ISSUE:
      return await handleCreateNewWorkItemViewSubmission(details, data);
    default:
      logger.error("Unknown view submission callback id:", { callbackId: data.view.callback_id });
      return;
  }
};

export const handleLinkWorkItemViewSubmission = async (
  details: TSlackConnectionDetails,
  data: TViewSubmissionPayload
) => {
  const { workspaceConnection, slackService, planeClient } = details;

  const linkWorkItemValues = parseLinkWorkItemFormData(data.view.state.values);

  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata<typeof ENTITIES.LINK_WORK_ITEM>;

  if (linkWorkItemValues) {
    const issue = await planeClient.issue.getIssueWithFields(
      linkWorkItemValues.workspaceSlug,
      linkWorkItemValues.projectId,
      linkWorkItemValues.issueId,
      ["state", "project", "assignees", "labels", "created_by", "updated_by"]
    );

    // Check if the issue is already linked to a thread
    const workspaceEntityConnection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
      workspace_connection_id: details.workspaceConnection.id,
      issue_id: linkWorkItemValues.issueId,
      entity_type: E_INTEGRATION_KEYS.SLACK,
    });

    if (workspaceEntityConnection.length > 0) {
      // We need to update the view in order to show that the selected issue is already linked to a thread
      const existingLink = workspaceEntityConnection[0];
      const entityData = existingLink.entity_data as TSlackIssueEntityData;
      const threadLink = getSlackThreadUrl(data.team.domain, entityData.channel, existingLink.entity_id ?? "");
      const issueLink = `${env.APP_BASE_URL}/${linkWorkItemValues.workspaceSlug}/browse/${issue.project.identifier}-${issue.sequence_id}`;

      // Create rich error message with links
      const errorMessage = createIssueErrorBlocks(issue, entityData.channel, threadLink, issueLink);
      const updatedModal = createLinkIssueModalView(metadata.entityPayload);
      updatedModal.blocks = [...errorMessage.blocks, ...updatedModal.blocks];
      const res = await slackService.openModal(data.trigger_id, updatedModal);
      logger.info("Response from slackService.openModal link work item:", res);
    } else {
      const messageTs = metadata.entityPayload.message?.ts;

      if (!messageTs) {
        logger.error("No message ts found in entity payload");
        return;
      }

      const title = "Connected to Slack thread";
      const link = getSlackThreadUrl(
        data.team.domain,
        metadata.entityPayload.channel.id,
        metadata.entityPayload.message?.ts ?? ""
      );

      const userMap = getUserMapFromSlackWorkspaceConnection(workspaceConnection);

      const linkBack = createSlackLinkback(linkWorkItemValues.workspaceSlug, issue, userMap, true);
      // Send a thread message to the channel
      const linkbackPromise = slackService.sendThreadMessage(
        metadata.entityPayload.channel.id,
        metadata.entityPayload.message?.ts || "",
        linkBack,
        issue,
        false
      );

      const createLinkInPlane = planeClient.issue.createLink(
        linkWorkItemValues.workspaceSlug,
        linkWorkItemValues.projectId,
        issue.id,
        title,
        link
      );

      const entityData: TSlackIssueEntityData = {
        channel: metadata.entityPayload.channel.id,
        message: {
          ts: messageTs,
          team: data.team.id,
        },
      };

      const createEntityConnection = apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
        // Main workspace connection
        workspace_connection_id: details.workspaceConnection.id,

        // Issue identifiers
        workspace_id: details.workspaceConnection.workspace_id,
        project_id: linkWorkItemValues.projectId,
        issue_id: issue.id,

        // Entity identifiers
        entity_type: E_INTEGRATION_KEYS.SLACK,
        entity_id: messageTs,
        entity_data: entityData,
        entity_slug: issue.id,
      });

      try {
        await Promise.all([linkbackPromise, createLinkInPlane, createEntityConnection]);
      } catch (error) {
        logger.error("Error processing link work item view submission:", { error });
      }
    }
  }
};

export const handleDisconnectWorkItemViewSubmission = async (
  details: TSlackConnectionDetails,
  data: TViewSubmissionPayload
) => {
  const { workspaceConnection, slackService } = details;

  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata<typeof ENTITIES.DISCONNECT_WORK_ITEM>;

  const workspaceEntityConnection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_connection_id: workspaceConnection.id,
    entity_id: metadata.entityPayload.message?.ts || "",
  });

  if (workspaceEntityConnection.length > 0) {
    // Disconnect the work item
    await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(workspaceEntityConnection[0].id);

    // Send a message to the channel
    await slackService.sendThreadMessage(metadata.entityPayload.channel.id, metadata.entityPayload.message?.ts ?? "", {
      text: "Work item disconnected from Slack thread.",
      blocks: [],
    });
  }
};

export const handleIssueCommentViewSubmission = async (
  details: TSlackConnectionDetails,
  data: TViewSubmissionPayload
) => {
  const { workspaceConnection, slackService, planeClient } = details;

  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata<
    typeof ENTITIES.ISSUE_COMMENT_SUBMISSION
  >;

  const thread_ts = metadata.entityPayload.message?.thread_ts;
  const channel = metadata.entityPayload.channel.id;
  const user = metadata.entityPayload.user.id;
  const value = metadata.entityPayload.value;
  const message_ts = metadata.entityPayload.message_ts;

  try {
    const values = value.split(".");

    if (values.length === 2) {
      const projectId = values[0];
      const issueId = values[1];

      let comment = "";

      Object.entries(data.view.state.values).forEach(([_, blockData]: [string, any]) => {
        if (blockData.comment_submit?.type === "plain_text_input") {
          comment = blockData.comment_submit.value;
        }
      });

      const slackUser = await slackService.getUserInfo(user);
      const projectMembers = await planeClient.users.list(workspaceConnection.workspace_slug, projectId);

      const member = projectMembers.find((member: any) => member.email === slackUser?.user.profile.email);

      await planeClient.issueComment.create(workspaceConnection.workspace_slug, projectId, issueId, {
        comment_html: "<p>" + comment + "</p>",
        created_by: member?.id,
        external_source: "SLACK-PRIVATE_COMMENT",
        external_id: data.view.id,
      });

      if (thread_ts) {
        await slackService.sendEphemeralMessage(user, `Comment successfully added to issue.`, channel, thread_ts);
      } else {
        await slackService.sendThreadMessage(channel, message_ts, `Comment successfully added to issue.`);
      }
    }
  } catch (error: any) {
    const isPermissionError = error?.detail?.includes(CONSTANTS.NO_PERMISSION_ERROR);
    const errorMessage = isPermissionError ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE : CONSTANTS.SOMETHING_WENT_WRONG;

    await slackService.sendEphemeralMessage(data.user.id, errorMessage, channel, thread_ts);

    if (!isPermissionError) {
      throw error;
    }
  }
};

export const handleIssueWeblinkViewSubmission = async (
  details: TSlackConnectionDetails,
  data: TViewSubmissionPayload
) => {
  const { workspaceConnection, slackService, planeClient } = details;

  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata<
    typeof ENTITIES.ISSUE_WEBLINK_SUBMISSION
  >;

  const thread_ts = metadata.entityPayload.message?.thread_ts;
  const user = metadata.entityPayload.user.id;
  const channel = metadata.entityPayload.channel.id;
  const message_ts = metadata.entityPayload.message_ts;
  const value = metadata.entityPayload.value;
  const values = value.split(".");
  const projectId = values[0];
  const issueId = values[1];
  let label = "";
  let url = "";

  try {
    Object.entries(data.view.state.values).forEach(([_, blockData]: [string, any]) => {
      Object.entries(blockData).forEach(([_, values]: [string, any]) => {
        if (values.type === "plain_text_input") {
          label = values.value;
        } else if (values.type === "url_text_input") {
          url = values.value;
        }
      });
    });

    const message = `Link <${url}|${label}> successfully added to issue.`;

    await planeClient.issue.createLink(workspaceConnection.workspace_slug, projectId, issueId, label, url);

    if (thread_ts) {
      await slackService.sendEphemeralMessage(user, message, channel, thread_ts);
    } else {
      await slackService.sendThreadMessage(channel, message_ts, message);
    }
  } catch (error: any) {
    const isPermissionError = error?.detail?.includes(CONSTANTS.NO_PERMISSION_ERROR);
    const errorMessage = isPermissionError ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE : CONSTANTS.SOMETHING_WENT_WRONG;

    await slackService.sendEphemeralMessage(data.user.id, errorMessage, channel, thread_ts);

    if (!isPermissionError) {
      throw error;
    }
  }
};

export const handleCreateNewWorkItemViewSubmission = async (
  details: TSlackConnectionDetails,
  data: TViewSubmissionPayload
) => {
  const { workspaceConnection, slackService, planeClient, credentials } = details;

  if (!credentials.target_access_token) {
    throw new Error("Target access token is required");
  }

  const formParser = createSlackFormParser({
    workspaceSlug: workspaceConnection.workspace_slug,
    accessToken: credentials.target_access_token,
  });

  const parsedData = await formParser.parse(data.view);

  try {
    const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata;

    if (
      metadata.entityType !== ENTITIES.SHORTCUT_PROJECT_SELECTION &&
      metadata.entityType !== ENTITIES.COMMAND_PROJECT_SELECTION
    ) {
      logger.info(`[SLACK] Unsupported payload type: ${metadata.entityType}`);
      return;
    }

    const slackUser = await slackService.getUserInfo(data.user.id);
    const members = await planeClient.users.listAllUsers(workspaceConnection.workspace_slug);
    const member = members.find((m: PlaneUser) => m.email === slackUser?.user.profile.email);
    const userMap = getUserMapFromSlackWorkspaceConnection(workspaceConnection);

    const parser = getSlackContentParser({
      userMap,
      teamDomain: data.team.domain,
    });

    if (data.view.callback_id === E_MESSAGE_ACTION_TYPES.CREATE_INTAKE_ISSUE) {
      await createIntakeIssueFromViewSubmission(
        parsedData as TIntakeFormResult,
        details,
        metadata,
        member,
        details,
        parser
      );
    } else {
      await createWorkItemFromViewSubmission(
        data.user.id,
        data.team.domain,
        parsedData as TWorkItemFormResult,
        details,
        metadata as SlackPrivateMetadata<
          typeof ENTITIES.SHORTCUT_PROJECT_SELECTION | typeof ENTITIES.COMMAND_PROJECT_SELECTION
        >,
        member,
        details,
        parser
      );
    }
  } catch (error: any) {
    const isPermissionError = error?.detail?.includes(CONSTANTS.NO_PERMISSION_ERROR);
    if (isPermissionError) {
      logger.error("Permission error in handleCreateNewWorkItemViewSubmission:", { error });
    } else {
      logger.error("Unexpected error in handleCreateNewWorkItemViewSubmission:", { error });
      throw error;
    }
  }
};

async function createIntakeIssueFromViewSubmission(
  parsedData: TIntakeFormResult,
  credentials: TSlackConnectionDetails,
  metadata: SlackPrivateMetadata,
  member: PlaneUser | undefined,
  details: TSlackConnectionDetails,
  parser: ContentParser
) {
  const { workspaceConnection, planeClient, slackService } = details;
  let parsedDescription: string;

  const userMap = getUserMapFromSlackWorkspaceConnection(workspaceConnection);

  try {
    parsedDescription = await parser.toPlaneHtml(parsedData.data.description_html ?? "<p></p>");
  } catch (error) {
    logger.error("[SLACK] Error parsing issue description:", error);
    // Fallback to the original description or a safe default
    parsedDescription = parsedData.data.description_html ?? "<p></p>";
  }

  const issue = await planeClient.intake.create(workspaceConnection.workspace_slug, parsedData.data.project, {
    issue: {
      name: parsedData.data.name,
      description_html: parsedDescription,
      created_by: member?.id,
      priority: parsedData.data.priority || "none",
      project: parsedData.data.project,
    },
  });

  const linkBack = createSlackIntakeLinkback(workspaceConnection.workspace_slug, issue, userMap, false, member);

  if (metadata.entityPayload.type === ENTITIES.SHORTCUT_PROJECT_SELECTION) {
    const payload = metadata.entityPayload as ShortcutActionPayload;
    const channelId = payload.channel.id;
    const messageTs = payload.message.ts;
    if (messageTs) {
      await slackService.sendThreadMessage(
        channelId,
        messageTs,
        {
          text: "Intake issue created successfully. ✅",
          blocks: linkBack.blocks,
        },
        issue,
        false
      );
    } else {
      logger.error("No message ts found in entity payload");
    }
  } else if (metadata.entityPayload.type === ENTITIES.COMMAND_PROJECT_SELECTION) {
    if (metadata.entityPayload.response_url) {
      await slackService.sendMessage(metadata.entityPayload.response_url, {
        text: "Intake issue created successfully. ✅",
        blocks: linkBack.blocks,
      });
    }
  }
}

async function createWorkItemFromViewSubmission(
  userId: string,
  teamDomain: string,
  parsedData: TWorkItemFormResult,
  credentials: TSlackConnectionDetails,
  metadata: SlackPrivateMetadata<
    typeof ENTITIES.SHORTCUT_PROJECT_SELECTION | typeof ENTITIES.COMMAND_PROJECT_SELECTION
  >,
  member: PlaneUser | undefined,
  details: TSlackConnectionDetails,
  parser: ContentParser
) {
  const { workspaceConnection, slackService, planeClient } = details;
  let parsedDescription: string;

  try {
    parsedDescription = await parser.toPlaneHtml(parsedData.data.description_html ?? "<p></p>");
  } catch (error) {
    logger.error("[SLACK] Error parsing issue description:", { error });
    // Fallback to the original description or a safe default
    parsedDescription = parsedData.data.description_html ?? "<p></p>";
  }

  let issueId: string;
  let projectId: string;
  let issue: ExIssue;

  if (metadata.entityPayload.mode === "update") {
    issueId = metadata.entityPayload.preselected_values?.issue_id ?? "";
    projectId = metadata.entityPayload.preselected_values?.project_id ?? "";

    if (!issueId || !projectId) {
      throw new Error("Issue id and project id are required for update mode");
    }

    issue = await planeClient.issue.update(workspaceConnection.workspace_slug, projectId, issueId, {
      ...parsedData.data,
      description_html: parsedDescription,
      created_by: member?.id,
    });
  } else {
    issue = await planeClient.issue.create(workspaceConnection.workspace_slug, parsedData.data.project, {
      ...parsedData.data,
      description_html: parsedDescription,
      created_by: member?.id,
    });

    projectId = parsedData.data.project;
    issueId = issue.id;

    if (parsedData.data.customFields) {
      await processCustomFields({
        customFields: parsedData.data.customFields,
        workspaceSlug: workspaceConnection.workspace_slug,
        projectId,
        issueId,
        planeClient,
      });
    }
  }

  const issueWithFields = await planeClient.issue.getIssueWithFields(
    workspaceConnection.workspace_slug,
    projectId,
    issueId,
    ["state", "project", "assignees", "labels", "created_by", "updated_by"]
  );

  const userMap = getUserMapFromSlackWorkspaceConnection(workspaceConnection);
  const enhancedUserMap = await enhanceUserMapWithSlackLookup({
    planeUsers: issueWithFields.assignees,
    currentUserMap: userMap,
    slackService,
  });

  const linkBack = createSlackLinkback(
    workspaceConnection.workspace_slug,
    issueWithFields,
    enhancedUserMap,
    parsedData.data.enable_thread_sync ?? false
  );

  // Step 6: Send the appropriate response based on entity type
  if (metadata.entityType === ENTITIES.SHORTCUT_PROJECT_SELECTION) {
    /* For shortcut project selection,
      - Send a thread message to the channel
      - Create a thread connection if thread sync is enabled
      Hence, we need to handle the shortcut project selection in a separate function
    */
    await handleShortcutProjectSelection(
      userId,
      teamDomain,
      slackService,
      apiClient,
      workspaceConnection,
      planeClient,
      parsedData.data.enable_thread_sync ?? false,
      metadata as SlackPrivateMetadata<typeof ENTITIES.SHORTCUT_PROJECT_SELECTION>,
      linkBack,
      issue,
      credentials
    );
  } else if (metadata.entityType === ENTITIES.COMMAND_PROJECT_SELECTION) {
    /* For command project selection,
      - Send a message to the response_url, directly to the channel
      Hence, we need to handle the command project selection in a separate function
    */
    await handleCommandProjectSelection(
      slackService,
      metadata as SlackPrivateMetadata<typeof ENTITIES.COMMAND_PROJECT_SELECTION>,
      linkBack
    );
  }
}

// Helper function for shortcut project selection handling
async function handleShortcutProjectSelection(
  userId: string,
  teamDomain: string,
  slackService: SlackService,
  apiClient: any,
  workspaceConnection: any,
  planeClient: any,
  enableThreadSync: boolean,
  metadata: SlackPrivateMetadata<typeof ENTITIES.SHORTCUT_PROJECT_SELECTION>,
  linkBack: any,
  issue: ExIssue,
  credentials: any
) {
  if (metadata.entityPayload.message.ts && metadata.entityPayload.mode !== "update") {
    const response = await slackService.getMessage(
      metadata.entityPayload.channel.id,
      metadata.entityPayload.message?.ts
    );

    if (response && response.ok && response.messages && response.messages.length > 0) {
      const message = response.messages[0];
      if (message.files && credentials.source_access_token) {
        const fileUploadPromises = message.files.map(async (file: any) => {
          const blob = await downloadFile(file.url_private_download, `Bearer ${credentials.source_access_token}`);
          if (blob) {
            await planeClient.issue.uploadAttachment(
              workspaceConnection.workspace_slug,
              issue.project,
              issue.id,
              blob as File,
              file.name,
              file.size,
              {
                type: file.mimetype,
              }
            );
          }
        });
        await Promise.all(fileUploadPromises);
      }
    }
    // Attach link of the slack thread to the issue
    const title = "Connected to Slack thread";
    const link = getSlackThreadUrl(teamDomain, metadata.entityPayload.channel.id, metadata.entityPayload.message?.ts);

    try {
      await planeClient.issue.createLink(workspaceConnection.workspace_slug, issue.project, issue.id, title, link);
    } catch (error) {
      logger.error("Error creating link to slack thread:", { error });
    }
  }

  let res: { ok: boolean; message: { thread_ts: string } } = { ok: false, message: { thread_ts: "" } };

  // Send thread message
  if (metadata.entityPayload.message.ts) {
    if (metadata.entityPayload.mode === "create") {
      res = await slackService.sendThreadMessage(
        metadata.entityPayload.channel.id,
        metadata.entityPayload.message.ts,
        linkBack,
        issue,
        false
      );
    } else {
      const response = await slackService.sendEphemeralMessage(
        userId,
        "Work Item updated successfully",
        metadata.entityPayload.channel.id,
        metadata.entityPayload.message.ts
      );
      res = { ok: response.status === 200, message: { thread_ts: metadata.entityPayload.message.ts } };
    }
  }

  if (res.ok) {
    await createOrDeleteThreadConnection(
      apiClient,
      workspaceConnection,
      issue.project,
      issue.id,
      {
        channel: metadata.entityPayload.channel.id,
        message: {
          ts: metadata.entityPayload.message.ts ?? "",
          thread_ts: res.message.thread_ts,
        },
      },
      enableThreadSync
    );
  }
}

// Helper function for command project selection handling
async function handleCommandProjectSelection(
  slackService: any,
  metadata: SlackPrivateMetadata<typeof ENTITIES.COMMAND_PROJECT_SELECTION>,
  linkBack: any
) {
  if (metadata.entityPayload.response_url) {
    await slackService.sendMessage(metadata.entityPayload.response_url, {
      text: "Work Item successfully created.",
      blocks: linkBack.blocks,
    });
  }
}

// Helper function to create thread connection
async function createOrDeleteThreadConnection(
  apiClient: APIClient,
  workspaceConnection: TWorkspaceConnection,
  projectId: string,
  issueId: string,
  entityData: {
    channel: string;
    message: {
      ts: string;
      thread_ts: string;
    };
  },
  enableThreadSync: boolean
) {
  const connections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    entity_id: entityData.message.thread_ts,
  });

  // If there is no connection and thread sync is enabled, create a new connection
  if (!connections || (connections.length === 0 && enableThreadSync)) {
    await apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
      workspace_id: workspaceConnection.workspace_id,
      workspace_connection_id: workspaceConnection.id,
      project_id: projectId,
      entity_type: E_INTEGRATION_KEYS.SLACK,
      entity_id: entityData.message.thread_ts,
      entity_data: entityData,
      entity_slug: issueId,
      issue_id: issueId,
    });
  } else if (connections && connections.length > 0 && !enableThreadSync) {
    connections.forEach(async (connection) => {
      await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(connection.id);
    });
  }
}

async function processCustomFields(params: {
  customFields: Record<string, any>;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  planeClient: Client;
}) {
  const { customFields, workspaceSlug, projectId, issueId, planeClient } = params;

  await Promise.all(
    Object.entries(customFields).map(async ([key, value]) => {
      let propertyId = key;

      if (key.includes(":")) {
        propertyId = key.split(":")[1];
      }

      let payload: ExIssuePropertyValue;

      if (typeof value === "string") {
        payload = [{ value }];
      } else if (Array.isArray(value)) {
        payload = value.map((v) => ({ value: v as string }));
      } else {
        payload = [{ value: value as string }];
      }

      await planeClient.issuePropertyValue.create(workspaceSlug, projectId, issueId, propertyId, { values: payload });
    })
  );
}

export const createIssueErrorBlocks = (
  issue: IssueWithExpanded<["state", "project", "assignees", "labels", "created_by", "updated_by"]>,
  channelName: string,
  threadLink: string,
  issueLink: string
) => {
  const errorMessage = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Work Item Already Linked",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:warning: The work item *<${issueLink}|[${issue.project.identifier}-${issue.sequence_id}] ${issue.name}>* is already linked to another conversation in <#${channelName}>.`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Linked Thread",
              emoji: true,
            },
            url: threadLink,
            style: "primary",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Work Item",
              emoji: true,
            },
            url: issueLink,
          },
        ],
      },
    ],
  };

  return errorMessage;
};
