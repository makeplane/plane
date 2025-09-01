import { E_SLACK_ENTITY_TYPE } from "@plane/etl/slack";
import { PlaneWebhookPayload } from "@plane/sdk";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { getConnectionDetails } from "../../helpers/connection-details";
import { enhanceUserMapWithSlackLookup, getUserMapFromSlackWorkspaceConnection } from "../../helpers/user";
import { createSlackLinkback } from "../../views/issue-linkback";

const apiClient = getAPIClient();

export const handleProjectUpdateWebhook = async (payload: PlaneWebhookPayload) => {
  const entityConnections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
    workspace_id: payload.workspace,
    project_id: payload.project,
    entity_type: E_SLACK_ENTITY_TYPE.SLACK_PROJECT_UPDATES,
  });

  if (entityConnections.length === 0) {
    logger.info("No entity connection found for project update webhook");
    return;
  }

  const workspaceConnection = await apiClient.workspaceConnection.getWorkspaceConnection(
    entityConnections[0].workspace_connection_id
  );

  if (!workspaceConnection) {
    logger.info("No workspace connection found for project update webhook");
    return;
  }

  const details = await getConnectionDetails(workspaceConnection.connection_id);

  if (!details) {
    logger.info("No details found for project update webhook");
    return;
  }

  const { slackService, planeClient } = details;

  const issue = await planeClient.issue.getIssueWithFields(
    workspaceConnection.workspace_slug,
    payload.project,
    payload.id,
    ["state", "project", "assignees", "labels", "created_by", "updated_by"]
  );

  const userMap = getUserMapFromSlackWorkspaceConnection(workspaceConnection);
  const enhancedUserMap = await enhanceUserMapWithSlackLookup({
    planeUsers: issue.assignees,
    currentUserMap: userMap,
    slackService,
  });

  const linkback = createSlackLinkback(workspaceConnection.workspace_slug, issue, enhancedUserMap, false);

  await Promise.all(
    entityConnections.map(async (entityConnection) => {
      // Get the channel id and project id from the entity connection
      const channelId = entityConnection.entity_id;

      const response = await slackService.sendMessageToChannel(channelId!, {
        blocks: linkback.blocks,
        text: "New work item created in Plane",
      });

      logger.info("Project update webhook sent", response);
    })
  );
};
