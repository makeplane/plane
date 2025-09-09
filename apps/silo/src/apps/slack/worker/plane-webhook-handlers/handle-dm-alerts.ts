import { PlaneWebhookPayload } from "@plane/sdk";
import { logger } from "@/logger";
import { Store } from "@/worker/base";
import { getConnectionDetailsForWorkspace } from "../../helpers/connection-details";
import { getPlaneToSlackUserMapFromWC } from "../../helpers/user";
import {
  dispatchSlackDMAlerts,
  fetchWorkItemDisplayInfo,
  createBlockPayloadMap,
  extractDMCandidatesMap,
  getParsedMarkdownFromAlert,
  getSlackDMAlertFromStore,
} from "../../services/alerts";

/*
 * This function takes responsibility for sending DM alerts to associated users.
 */
export const handleDMAlertWebhook = async (payload: PlaneWebhookPayload) => {
  // An alert includes all the activities that happened for an issue or a comment from users
  try {
    const store = Store.getInstance();
    const alert = await getSlackDMAlertFromStore(store, {
      workspace_id: payload.workspace,
      project_id: payload.project,
      issue_id: payload.issue,
      issue_comment_id: payload.issue_comment,
    });

    const details = await getConnectionDetailsForWorkspace(payload, null);

    if (!details || !alert) {
      logger.error("No details or alert found for DM alert webhook", { payload });
      return;
    }

    const { workspaceConnection, slackService, planeClient } = details;
    const { workspace_slug } = workspaceConnection;

    const parsedMarkdownFromAlert = await getParsedMarkdownFromAlert(alert, workspaceConnection);
    const workItemDisplayInfo = await fetchWorkItemDisplayInfo(
      planeClient,
      workspace_slug,
      alert.project_id,
      alert.issue_id
    );
    /*
     * We are interested in the users that are the candidates for DM Alerts, those include
     * - Users that are mentioned in the activities
     * - Users that have the alert enabled
     *
     * This map is sort of a truth table for us, if the user is in the map, this means
     * we can send DM alerts to them.
     */
    const planeToSlackMap = getPlaneToSlackUserMapFromWC(workspaceConnection);
    const dmCandidatesMap = extractDMCandidatesMap(alert.activities, planeToSlackMap, workspaceConnection);
    const blockPayloadMap = createBlockPayloadMap(alert, dmCandidatesMap, {
      workspaceSlug: workspace_slug,
      workItemDisplayInfo,
      parsedMarkdownFromAlert,
      planeToSlackMap,
      actorDisplayName: payload.actor_display_name ?? "",
    });
    await dispatchSlackDMAlerts(slackService, blockPayloadMap);
  } catch (error) {
    logger.error("Error handling DM alert webhook", { error });
  }
};
