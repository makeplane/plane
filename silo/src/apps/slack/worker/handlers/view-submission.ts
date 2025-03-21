import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { TViewSubmissionPayload } from "@plane/etl/slack";
import { CONSTANTS } from "@/helpers/constants";
import { downloadFile } from "@/helpers/utils";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { getConnectionDetails } from "../../helpers/connection-details";
import { ENTITIES } from "../../helpers/constants";
import { parseIssueFormData } from "../../helpers/parse-issue-form";
import { SlackPrivateMetadata } from "../../types/types";
import { createSlackLinkback } from "../../views/issue-linkback";

const apiClient = getAPIClient();

export const handleViewSubmission = async (data: TViewSubmissionPayload) => {
  const details = await getConnectionDetails(data.team.id);
  if (!details) {
    logger.info(`[SLACK] No connection details found for team ${data.team.id}`);
    return;
  }

  const { workspaceConnection, slackService, planeClient, credentials } = details;

  const metadata = JSON.parse(data.view.private_metadata) as SlackPrivateMetadata;

  try {
    const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
    projects.results.filter((project) => project.is_member === true);

    const parsedData = parseIssueFormData(data.view.state.values);

    if (metadata.entityPayload.type === "message_action" || metadata.entityPayload.type === "command_project_selection") {
      try {
        const slackUser = await slackService.getUserInfo(data.user.id);
        const members = await planeClient.users.listAllUsers(workspaceConnection.workspace_slug);
        const member = members.find((member) => member.email === slackUser?.user.profile.email);

        /* ==================== Create Issue ==================== */
        const issue = await planeClient.issue.create(workspaceConnection.workspace_slug, parsedData.project, {
          name: parsedData.title,
          description_html: parsedData.description == null ? "<p></p>" : parsedData.description,
          created_by: member?.id,
          state: parsedData.state,
          priority: parsedData.priority,
          labels: parsedData.labels,
        });

        const project = await planeClient.project.getProject(workspaceConnection.workspace_slug, parsedData.project);
        const states = await planeClient.state.list(workspaceConnection.workspace_slug, issue.project);

        const linkBack = createSlackLinkback(
          workspaceConnection.workspace_slug,
          project,
          members,
          states.results,
          issue,
          parsedData.enableThreadSync || false
        );

        if (metadata.entityType === ENTITIES.ISSUE_SUBMISSION && metadata.entityPayload.type === "message_action") {
          /* ==================== Send Linkback ==================== */
          const res = await slackService.sendThreadMessage(
            metadata.entityPayload.channel.id,
            metadata.entityPayload.message?.ts,
            linkBack,
            issue,
            false
          );

          // If thread sync is enabled and the response is ok for the linkback
          if (parsedData.enableThreadSync && res.ok) {
            // If thread sync is enabled, create an entity connection for the issue
            // check if the connection already exists
            const connections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
              entity_id: res.message.thread_ts,
            });
            if (!connections || connections.length === 0) {
              await apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
                workspace_id: workspaceConnection.workspace_id,
                workspace_connection_id: workspaceConnection.id,
                project_id: parsedData.project,
                entity_type: E_INTEGRATION_KEYS.SLACK,
                entity_id: res.message.thread_ts,
                entity_data: res,
                entity_slug: issue.id,
                issue_id: issue.id,
              });
            }
          } else {
            logger.error("Error sending thread message:");
            console.error(res);
          }

          /* ==================== File Upload ==================== */

          if (metadata.entityPayload.message.ts) {
            const response = await slackService.getMessage(
              metadata.entityPayload.channel.id,
              metadata.entityPayload.message?.ts
            );

            if (response && response.ok && response.messages && response.messages.length > 0) {
              const message = response.messages[0];
              if (message.files && credentials.source_access_token) {
                const fileUploadPromises = message.files.map(async (file) => {
                  const blob = await downloadFile(file.url_private_download, `Bearer ${credentials.source_access_token}`);
                  if (blob) {
                    await planeClient.issue.uploadAttachment(
                      workspaceConnection.workspace_slug,
                      parsedData.project,
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
          }
        } else if (metadata.entityPayload.type === "command_project_selection") {
          if (metadata.entityPayload.response_url)
            await slackService.sendMessage(metadata.entityPayload.response_url, {
              text: "Issue successfully created. 😄",
              blocks: linkBack.blocks,
            });
        }
      } catch (error: any) {
        const isPermissionError = error?.detail?.includes(CONSTANTS.NO_PERMISSION_ERROR);
        if (isPermissionError) {
          logger.error("Permission error in handleViewSubmission:", error);
        } else {
          throw error;
        }
      }
    } else if (metadata.entityType === ENTITIES.ISSUE_COMMENT_SUBMISSION) {
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

          const member = projectMembers.find((member) => member.email === slackUser?.user.profile.email);

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
        const errorMessage = isPermissionError
          ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE
          : CONSTANTS.SOMETHING_WENT_WRONG;

        await slackService.sendEphemeralMessage(data.user.id, errorMessage, channel, thread_ts);

        if (!isPermissionError) {
          throw error;
        }
      }
    } else if (metadata.entityType === ENTITIES.ISSUE_WEBLINK_SUBMISSION) {
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
        const errorMessage = isPermissionError
          ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE
          : CONSTANTS.SOMETHING_WENT_WRONG;

        await slackService.sendEphemeralMessage(data.user.id, errorMessage, channel, thread_ts);

        if (!isPermissionError) {
          throw error;
        }
      }
    }
  } catch (error: any) {
    logger.error("Unexpected error in handleViewSubmission:", error);
    throw error;
  }
};
