import { getEntityConnectionByEntitySlug } from "@/db/query/connection";
import { WebhookIssueCommentPayload } from "@plane/sdk";
import { getConnectionDetails } from "../../helpers/connection-details";
import { SlackMessageResponse } from "@silo/slack";
import { getCredentialsByWorkspaceId } from "@/db/query";

export const handleIssueCommentWebhook = async (payload: WebhookIssueCommentPayload) => {
  await handleCommentSync(payload);
};

const handleCommentSync = async (payload: WebhookIssueCommentPayload) => {
  const data = payload as unknown as WebhookIssueCommentPayload["created"];
  const entityConnection = await getEntityConnectionByEntitySlug(
    data.data.workspace,
    data.data.project,
    data.data.issue
  );

  if (data.data.external_id === null) {
    // Search for the credentials of the creator
    const credentials = await getCredentialsByWorkspaceId(data.data.workspace, data.data.created_by, "SLACK-USER");

    const slackData = entityConnection[0].entityData as SlackMessageResponse;
    const { slackService } = await getConnectionDetails(slackData.message.team);

    if (credentials && credentials.length > 0 && credentials[0].source_access_token) {
      await slackService.sendMessageAsUser(
        slackData.channel,
        entityConnection[0].entityId,
        data.data.comment_stripped,
        credentials[0].source_access_token
      );
    } else {
      await slackService.sendThreadMessage(slackData.channel, entityConnection[0].entityId, data.data.comment_stripped);
    }
  }
};
