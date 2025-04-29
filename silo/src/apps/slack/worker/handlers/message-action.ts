import { TMessageActionPayload } from "@plane/etl/slack";
import { convertToSlackOptions } from "@/apps/slack/helpers/slack-options";
import { createProjectSelectionModal } from "@/apps/slack/views";
import { logger } from "@/logger";
import { getConnectionDetails } from "../../helpers/connection-details";

export const handleMessageAction = async (data: TMessageActionPayload) => {
  // Get the workspace connection for the associated team
  const details = await getConnectionDetails(data.team.id);
  if (!details) {
    logger.info(`[SLACK] No connection details found for team ${data.team.id}`);
    return;
  }

  const { workspaceConnection, slackService, planeClient } = details;

  const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
  const filteredProjects = projects.results.filter((project) => project.is_member === true);
  const plainTextOptions = convertToSlackOptions(filteredProjects);
  const modal = createProjectSelectionModal(plainTextOptions, {
    type: "message_action",
    message: {
      text: data.message.text,
      ts: data.message.ts,
    },
    channel: {
      id: data.channel.id,
    },
  });

  try {
    const res = await slackService.openModal(data.trigger_id, modal);
    if (res && !res.ok) {
      logger.error("Something went wrong while opening the modal", res);
    }
  } catch (error) {
    logger.error(error);
  }
};
