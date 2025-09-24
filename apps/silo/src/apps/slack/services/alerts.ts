import { SlackService, TSlackUserAlertsConfig } from "@plane/etl/slack";
import {
  PlaneWebhookPayloadBase,
  ExIssue,
  ExIssueComment,
  PlaneActivity,
  E_PLANE_WEBHOOK_EVENT,
  Client,
} from "@plane/sdk";
import { TWorkspaceConnection } from "@plane/types";
import { getSlackDMAlertKey } from "@/helpers/cache-keys";
import { processBatchPromises } from "@/helpers/methods";
import { extractUserMentionFromHtml } from "@/helpers/parser";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import { logger } from "@/logger";
import { E_KNOWN_FIELD_KEY } from "@/types/form/base";
import { Store } from "@/worker/base";
import { getAssigneeDmAlertText, getCommentDmAlertText, getIssueDescriptionDmAlertText } from "../helpers/activity";
import { getSlackMarkdownFromPlaneHtml } from "../helpers/parse-plane-resources";
import { createSlackHyperlinkMarkdown } from "../helpers/slack-options";
import {
  TSlackDMAlert,
  TSlackDMAlertActivity,
  ESlackDMAlertActivityType,
  ESlackDMAlertType,
  TSlackDMAlertBlockPayload,
  TSlackDMBlockFormationCtx,
  TSlackDMWorkItemDisplayInfo,
  TSlackDMAlertKeyProps,
  ESlackDMAlertActivityAction,
} from "../types/alerts";
import { TSlackWorkspaceConnectionConfig } from "../types/types";
import { createCommentLinkback } from "../views/comments";

/**
 * @fileoverview Slack DM Alert - Core business logic for processing Plane webhooks
 * into Slack notifications. Handles alert extraction, storage, user filtering, and dispatch.
 * Supports: assignee changes, comment mentions, and issue description mentions.
 */

// ============================================================================
// ALERT EXTRACTION & PROCESSING
// ============================================================================

/**
 * Extracts DM alert activities from webhook payload based on event type
 * @throws {Error} If the event type is not supported
 */
export const extractSlackDMAlertsFromWebhook = (
  payload: PlaneWebhookPayloadBase<ExIssue | ExIssueComment>
): TSlackDMAlert => {
  switch (payload.event) {
    case E_PLANE_WEBHOOK_EVENT.ISSUE:
      return {
        activities: extractSlackDmAlertsFromIssue(payload),
        workspace_id: payload.workspace_id,
        project_id: payload.data.project,
        issue_id: payload.data.id,
        comment_id: undefined,
        type: ESlackDMAlertType.ISSUE,
        payload: payload.data as ExIssue,
      };

    case E_PLANE_WEBHOOK_EVENT.ISSUE_COMMENT:
      return {
        activities: extractUserMentionFromHtml(payload.data.comment_html)
          .map((userId) => ({
            actor_id: userId,
            type: ESlackDMAlertActivityType.COMMENT_MENTION,
            action: ESlackDMAlertActivityAction.ADDED,
          }))
          .filter((activity) => (payload.activity.actor?.id ? activity.actor_id !== payload.activity.actor?.id : true)),
        workspace_id: payload.workspace_id,
        project_id: payload.data.project,
        issue_id: payload.data.issue,
        comment_id: payload.data.id,
        type: ESlackDMAlertType.COMMENT,
        payload: payload.data as ExIssueComment,
      };

    default:
      logger.error("Unsupported event type", { payload });
      throw new Error(`Unsupported event type: ${payload.event}`);
  }
};

/**
 * Merges alerts with deduplication of activities
 * @param storedAlert - Existing alert from store
 * @param newAlert - New alert to merge
 * @returns Merged alert with deduplicated activities
 */
const patchAlertsForDeduplication = (storedAlert: TSlackDMAlert, newAlert: TSlackDMAlert): TSlackDMAlert => {
  const createSignature = (activity: TSlackDMAlertActivity) =>
    `${activity.actor_id}:${activity.type}:${activity.action}`;

  const existingActivitySignatures = new Set(
    // Just a temporary key for the deduplication, there is no major significance to it.
    storedAlert.activities.map((activity) => createSignature(activity))
  );

  const uniqueNewActivities = newAlert.activities.filter((activity) => {
    const signature = createSignature(activity);
    return !existingActivitySignatures.has(signature);
  });

  const mergedActivities = [...storedAlert.activities, ...uniqueNewActivities];

  return {
    ...storedAlert,
    activities: mergedActivities,
    comment_id: storedAlert.comment_id || newAlert.comment_id,
  };
};

/**
 * Collects DM alert activities from issue webhook payload
 * @param payload - Issue webhook payload containing activity data
 * @returns Array of DM alert activities extracted from the payload
 * @private
 */
const extractSlackDmAlertsFromIssue = (payload: PlaneWebhookPayloadBase<ExIssue>): TSlackDMAlertActivity[] => {
  if (payload.activity.field === E_KNOWN_FIELD_KEY.ASSIGNEE_IDS) {
    return extractAssigneeChangeActivity(payload.activity);
  } else if (payload.activity.field === E_KNOWN_FIELD_KEY.DESCRIPTION_HTML) {
    return extractUserMentionFromHtml(payload.data.description_html)
      .map((userId) => ({
        actor_id: userId,
        type: ESlackDMAlertActivityType.WORK_ITEM_DESCRIPTION_MENTION,
        action: ESlackDMAlertActivityAction.ADDED,
      }))
      .filter((activity) => (payload.activity.actor?.id ? activity.actor_id !== payload.activity.actor?.id : true));
  }

  return [];
};

/**
 * Calculates assignee changes between old and new values
 * @param activity - Plane activity containing old and new assignee values
 * @returns Array of alert activities for added and removed assignees
 * @private
 */
const extractAssigneeChangeActivity = (activity: PlaneActivity): TSlackDMAlertActivity[] => {
  // TODO: This is a temporary fix to get the assignee ids.
  const newAssigneeIds = (activity.new_value as unknown as string[]) || [];
  const oldAssigneeIds = (activity.old_value as unknown as string[]) || [];

  // Filter assignee changes, excluding actor if present
  const actorId = activity.actor?.id;
  const addedAssignees = newAssigneeIds.filter((id) => !oldAssigneeIds.includes(id) && (!actorId || id !== actorId));
  const removedAssignees = oldAssigneeIds.filter((id) => !newAssigneeIds.includes(id) && (!actorId || id !== actorId));

  return [
    ...addedAssignees.map((id) => ({
      actor_id: id,
      type: ESlackDMAlertActivityType.ASSIGNEE,
      action: ESlackDMAlertActivityAction.ADDED,
    })),
    ...removedAssignees.map((id) => ({
      actor_id: id,
      type: ESlackDMAlertActivityType.ASSIGNEE,
      action: ESlackDMAlertActivityAction.REMOVED,
    })),
  ];
};

/**
 * Filters users eligible for DM alerts based on activity participation and preferences
 * @param activities - Array of alert activities containing actor IDs
 * @param planeToSlackMap - Map of Plane user IDs to Slack user IDs
 * @param workspaceConnection - Workspace connection containing user alert preferences
 * @returns Map of eligible Plane user IDs to their Slack user IDs
 */
export const extractDMCandidatesMap = (
  activities: TSlackDMAlertActivity[],
  planeToSlackMap: Map<string, string>,
  workspaceConnection: TWorkspaceConnection
): Map<string, string> => {
  const alertConfig = extractSlackUserAlertsConfigFromWC(workspaceConnection);

  const actors = activities.map((activity) => activity.actor_id);
  const users = Object.keys(alertConfig);

  // Filter users who are actors in the activities AND have alerts enabled
  const candidates = users.filter((user) => actors.includes(user) && alertConfig[user].isEnabled);

  // Create the final map of Plane User ID to Slack User ID for candidates
  const dmCandidatesMap = new Map<string, string>();
  candidates.forEach((planeUserId) => {
    const slackUserId = planeToSlackMap.get(planeUserId);
    if (slackUserId) {
      dmCandidatesMap.set(planeUserId, slackUserId);
    }
  });

  return dmCandidatesMap;
};

// ============================================================================
// STORE OPERATIONS
// ============================================================================
/**
 * Retrieves a DM alert from the store by its key properties
 * @param props - Alert key properties to locate the stored alert
 * @returns Promise resolving to the alert object or undefined if not found
 */
export const getSlackDMAlertFromStore = async (
  store: Store,
  props: TSlackDMAlertKeyProps
): Promise<TSlackDMAlert | undefined> => {
  const key = getSlackDMAlertKey(props);

  const alert = await store.get(key);
  if (!alert) {
    return undefined;
  }

  try {
    return JSON.parse(alert) as TSlackDMAlert;
  } catch (error) {
    logger.error(`Error parsing alert from store:`, { alert, error });
    return undefined;
  }
};

/**
 * Sets a DM alert in the store with automatic deduplication
 * @param props - Alert key properties (workspace_id, project_id, issue_id, issue_comment_id)
 * @param alert - The alert object to store
 */
export const setSlackDMAlert = async (
  store: Store,
  props: TSlackDMAlertKeyProps,
  alert: TSlackDMAlert,
  ttl: number = 10
) => {
  const { workspace_id, project_id, issue_id, issue_comment_id } = props;
  const key = getSlackDMAlertKey({
    workspace_id,
    project_id,
    issue_id,
    issue_comment_id,
  });

  // Get the existing alert from the store
  try {
    const existingAlert = await store.get(key);
    if (existingAlert) {
      const existingAlertObject = JSON.parse(existingAlert) as TSlackDMAlert;
      const patchedAlert = patchAlertsForDeduplication(existingAlertObject, alert);
      await store.set(key, JSON.stringify(patchedAlert), ttl, false);
    } else {
      await store.set(key, JSON.stringify(alert), ttl, false);
    }
  } catch (error) {
    logger.error("Error setting alert in store", { error, key });
  }
};

// ============================================================================
// BLOCK CREATION
// ============================================================================

/**
 * Creates a map of user IDs to their corresponding Slack block payloads
 * @param alert - DM alert containing activities to process
 * @param dmCandidatesMap - Map of eligible Plane user IDs to Slack user IDs
 * @param blockFormationCtx - Context needed for block creation
 * @returns Map of Slack user IDs to their block payloads
 */
export const createBlockPayloadMap = (
  alert: TSlackDMAlert,
  dmCandidatesMap: Map<string, string>,
  blockFormationCtx: TSlackDMBlockFormationCtx
): Map<string, TSlackDMAlertBlockPayload[]> => {
  const blockMap = new Map<string, TSlackDMAlertBlockPayload[]>();

  alert.activities.forEach((activity) => {
    const { actor_id } = activity;
    const slackUserId = dmCandidatesMap.get(actor_id);
    if (!slackUserId) {
      logger.error("No slack user ID found for actor", { actor_id });
      return;
    }

    // Get block for this specific activity
    const block = createBlocksForActivityType(blockFormationCtx, alert, activity);

    // Add to user's activity list
    const existingBlocks = blockMap.get(slackUserId) || [];
    blockMap.set(slackUserId, [...existingBlocks, block]);
  });

  return blockMap;
};

/**
 * Routes activity types to their corresponding block creation functions
 * @param blockFormationCtx - Context needed for block creation
 * @param alert - DM alert containing the activity
 * @param activity - Specific activity to create block for
 * @returns Slack block payload for the activity
 * @throws { Error } If the activity type is not supported
 */
const createBlocksForActivityType = (
  blockFormationCtx: TSlackDMBlockFormationCtx,
  alert: TSlackDMAlert,
  activity: TSlackDMAlertActivity
): TSlackDMAlertBlockPayload => {
  switch (activity.type) {
    case ESlackDMAlertActivityType.ASSIGNEE:
      return createAssigneeBlock(blockFormationCtx, alert, activity);
    case ESlackDMAlertActivityType.COMMENT_MENTION:
      return createCommentBlock(blockFormationCtx, alert);
    case ESlackDMAlertActivityType.WORK_ITEM_DESCRIPTION_MENTION:
      return createIssueDescriptionBlock(blockFormationCtx);
    default:
      logger.error("Unknown activity type", { activity });
      throw new Error(`Unknown activity type: ${activity.type}`);
  }
};

/**
 * Creates Slack block payload for assignee change activities
 * @param blockFormationCtx - Context needed for block creation
 * @param alert - DM alert (must be ISSUE type)
 * @param activity - Assignee activity with added/removed info
 * @returns Slack block payload for assignee changes
 * @throws { Error }
 */
const createAssigneeBlock = (
  blockFormationCtx: TSlackDMBlockFormationCtx,
  alert: TSlackDMAlert,
  activity: TSlackDMAlertActivity
): TSlackDMAlertBlockPayload => {
  if (alert.type !== ESlackDMAlertType.ISSUE) {
    throw new Error("Assignee block can only be used for issue alerts");
  }

  const {
    workspaceSlug,
    actorDisplayName,
    workItemDisplayInfo: { displayText, url },
  } = blockFormationCtx;

  return {
    text: getAssigneeDmAlertText(
      workspaceSlug,
      actorDisplayName,
      activity.action,
      createSlackHyperlinkMarkdown(displayText, url)
    ),
    blocks: [],
    unfurlLinks: true,
  };
};

/**
 * Creates Slack block payload for comment mention activities
 * @param blockFormationCtx - Context needed for block creation
 * @param alert - DM alert (must be COMMENT type with comment_id)
 * @returns Slack block payload for comment mentions
 * @throws { Error }
 */
const createCommentBlock = (
  blockFormationCtx: TSlackDMBlockFormationCtx,
  alert: TSlackDMAlert
): TSlackDMAlertBlockPayload => {
  if (alert.type !== ESlackDMAlertType.COMMENT) {
    throw new Error("Comment block can only be used for comment alerts");
  }

  const {
    workspaceSlug,
    workItemDisplayInfo: { displayText, url },
    actorDisplayName,
  } = blockFormationCtx;
  const workItemHyperlink = createSlackHyperlinkMarkdown(displayText, url);

  const commentBlocks = createCommentLinkback({
    blockFormationCtx,
    workItemHyperlink,
    projectId: alert.project_id,
    issueId: alert.issue_id,
    createdBy: alert.payload.created_by,
  });

  return {
    text: getCommentDmAlertText(workspaceSlug, actorDisplayName, workItemHyperlink),
    blocks: commentBlocks,
    unfurlLinks: false,
  };
};

/**
 * Creates Slack block payload for issue description mention activities
 * @param blockFormationCtx - Context needed for block creation
 * @returns Slack block payload for issue description mentions
 */
const createIssueDescriptionBlock = (blockFormationCtx: TSlackDMBlockFormationCtx): TSlackDMAlertBlockPayload => {
  const {
    workspaceSlug,
    actorDisplayName,
    workItemDisplayInfo: { displayText, url },
  } = blockFormationCtx;

  return {
    text: getIssueDescriptionDmAlertText(
      workspaceSlug,
      actorDisplayName,
      createSlackHyperlinkMarkdown(displayText, url)
    ),
    blocks: [],
    unfurlLinks: true,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts alert content to parsed Slack markdown
 * @param alert - DM alert
 * @param workspaceConnection - Workspace connection for context
 * @returns Promise resolving to parsed Slack markdown string
 */
export const getParsedMarkdownFromAlert = async (
  alert: TSlackDMAlert,
  workspaceConnection: TWorkspaceConnection
): Promise<string> => {
  if (alert.type === ESlackDMAlertType.COMMENT) {
    return getSlackMarkdownFromPlaneHtml({
      workspaceConnection,
      html: alert.payload.comment_html,
    });
  } else if (alert.type === ESlackDMAlertType.ISSUE) {
    return getSlackMarkdownFromPlaneHtml({
      workspaceConnection,
      html: alert.payload.description_html,
    });
  }
  return "";
};

// ============================================================================
// CONFIG OPERATIONS
// ============================================================================

/**
 * Gets alert configuration for a specific user from workspace connection
 * @param workspaceConnection - Workspace connection containing user configs
 * @param planeUserId - ID of the user to get config for
 * @returns User's alert configuration or undefined if not found
 */
export const extractSlackDMAlertConfigForPlaneUser = (
  workspaceConnection: TWorkspaceConnection<TSlackWorkspaceConnectionConfig>,
  planeUserId: string
): TSlackUserAlertsConfig | undefined => {
  const dmAlertsConfig = extractSlackUserAlertsConfigFromWC(workspaceConnection);

  if (!dmAlertsConfig[planeUserId]) {
    return undefined;
  }

  return dmAlertsConfig[planeUserId];
};

/**
 * Extracts all user alerts config from workspace connection
 * @param workspaceConnection - Workspace connection containing all user configs
 * @returns Record mapping user IDs to their alert configurations
 */
export const extractSlackUserAlertsConfigFromWC = (
  workspaceConnection: TWorkspaceConnection<TSlackWorkspaceConnectionConfig>
): Record<string, TSlackUserAlertsConfig> => {
  const { config } = workspaceConnection;
  /*
    This function is necessary as in future we might need to add certain filters to the alerts config,
    along with that if the structure changes, we can just update this function.
  */
  return config.alertsConfig?.dmAlerts || {};
};

/**
 * Updates alert configuration for a user in workspace connection
 * @param workspaceConnection - Workspace connection
 * @param planeUserId - ID of the user to set config for
 * @param userAlertsConfig - New alert configuration for the user
 * @returns Updated workspace connection config
 */
export const setSlackUserAlertsConfig = (
  workspaceConnection: TWorkspaceConnection<TSlackWorkspaceConnectionConfig>,
  planeUserId: string,
  userAlertsConfig: TSlackUserAlertsConfig
): TSlackWorkspaceConnectionConfig => {
  const { config } = workspaceConnection;

  if (!config.alertsConfig) {
    config.alertsConfig = { dmAlerts: {} };
  }

  if (!config.alertsConfig.dmAlerts) {
    config.alertsConfig.dmAlerts = {};
  }

  config.alertsConfig.dmAlerts[planeUserId] = userAlertsConfig;
  return config;
};

// ============================================================================
// Display and Dispatch
// ============================================================================

/**
 * We only need a couple of fields for display, this function takes the responsibility
 * for fetching the issue, and giving us with only the fields that will be helpful to
 * display, which results in easy mocking and testing.
 * @param planeClient - Plane client
 * @param workspaceSlug - Workspace identifier
 * @param projectId - Project identifier
 * @param issueId - Issue identifier
 * @returns Promise resolving to work item display info with URL and text
 */
export const fetchWorkItemDisplayInfo = async (
  planeClient: Client,
  workspaceSlug: string,
  projectId: string,
  issueId: string
): Promise<TSlackDMWorkItemDisplayInfo> => {
  const issueWithFields = await planeClient.issue.getIssueWithFields(workspaceSlug, projectId, issueId, ["project"]);
  const project = issueWithFields.project;
  const sequenceId = issueWithFields.sequence_id;

  return {
    url: getIssueUrlFromSequenceId(workspaceSlug, project.identifier ?? "", sequenceId.toString()),
    displayText: `${project.identifier}-${sequenceId} ${issueWithFields.name}`,
    title: issueWithFields.name,
    identifier: `${project.identifier}-${sequenceId}`,
  };
};

/**
 * Dispatches DM alerts to all candidate users
 * @param slackService - Slack service instance for sending messages
 * @param blockPayloadMap - Map of user IDs to their respective block payloads
 */
export const dispatchSlackDMAlerts = async (
  slackService: SlackService,
  blockPayloadMap: Map<string, TSlackDMAlertBlockPayload[]>
) => {
  const sendSlackMessageForUser = async (userId: string) => {
    const blockPayload = blockPayloadMap.get(userId);
    if (!blockPayload || blockPayload.length === 0) {
      logger.error("No activity blocks found for user", { userId });
      return false;
    }

    const results = await Promise.all(
      blockPayload.map(async (block) => {
        const response = await slackService.sendThreadMessage(
          userId,
          "",
          {
            text: block.text,
            blocks: block.blocks,
          },
          undefined,
          block.unfurlLinks
        );
        return response;
      })
    );

    logger.info("Dispatched DM alerts to user", {
      userId,
      messagesCount: blockPayload.length,
      results,
    });

    return true;
  };

  await processBatchPromises(Array.from(blockPayloadMap.keys()), async (userId) => sendSlackMessageForUser(userId));
};
