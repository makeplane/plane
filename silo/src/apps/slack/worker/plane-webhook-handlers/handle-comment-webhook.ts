import { E_ENTITY_CONNECTION_KEYS } from "@plane/etl/core";
import { SlackMessageResponse } from "@plane/etl/slack";
import { WebhookIssueCommentPayload } from "@plane/sdk";
import { getAPIClient } from "@/services/client";
import { getConnectionDetails } from "../../helpers/connection-details";

const apiClient = getAPIClient();

export const handleIssueCommentWebhook = async (payload: WebhookIssueCommentPayload) => {
  await handleCommentSync(payload);
};

const handleCommentSync = async (payload: WebhookIssueCommentPayload) => {
  const data = payload as unknown as WebhookIssueCommentPayload["created"];
  const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: data.data.workspace,
    project_id: data.data.project,
    entity_slug: data.data.issue,
  });

  /*
  In cases where we got a webhook from a comment, but the issues associated with the comment is not part of thread sync, which implies
  that there is no entity connection for the issue.
  */
  if (!entityConnection) {
    return;
  }

  if (data.data.external_id === null) {
    // Search for the credentials of the creator
    const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
      user_id: data.data.created_by,
      workspace_id: data.data.workspace,
      source: E_ENTITY_CONNECTION_KEYS.SLACK_USER,
    });

    const slackData = entityConnection.entity_data as SlackMessageResponse;
    const { slackService } = await getConnectionDetails(slackData.message.team);

    if (credentials && credentials.length > 0 && credentials[0].source_access_token) {
      await slackService.sendMessageAsUser(
        slackData.channel,
        entityConnection.entity_id ?? "",
        data.data.comment_stripped,
        credentials[0].source_access_token
      );
    } else {
      await slackService.sendThreadMessage(
        slackData.channel,
        entityConnection.entity_id ?? "",
        data.data.comment_stripped
      );
    }
  }
};
