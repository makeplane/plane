import { TSlackCommandPayload } from "@plane/etl/slack";
import { logger } from "@plane/logger";
import { CONSTANTS } from "@/helpers/constants";
import { getConnectionDetails } from "../../helpers/connection-details";
import { ENTITIES } from "../../helpers/constants";
import { convertToSlackOptions } from "../../helpers/slack-options";
import { createProjectSelectionModal } from "../../views";
import { getAccountConnectionBlocks } from "../../views/account-connection";

export const handleCommand = async (data: TSlackCommandPayload) => {
  const details = await getConnectionDetails(data.team_id, {
    id: data.user_id,
  });
  if (!details) {
    logger.info(`[SLACK] No connection details found for team ${data.team_id}`);
    return;
  }

  if (details.missingUserCredentials) {
    const { slackService } = details;

    await slackService.sendEphemeralMessage(
      data.user_id,
      "Please connect your Slack account to Plane to use this feature.",
      data.channel_id,
      undefined,
      getAccountConnectionBlocks(details)
    );

    return;
  }

  const { workspaceConnection, slackService, planeClient } = details;

  try {
    const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
    const filteredProjects = projects.results.filter((project) => project.is_member === true);
    const plainTextOptions = convertToSlackOptions(filteredProjects);
    const modal = createProjectSelectionModal(
      plainTextOptions,
      {
        type: ENTITIES.COMMAND_PROJECT_SELECTION,
        message: {},
        channel: {
          id: data.channel_id,
        },
        response_url: data.response_url,
      },
      undefined,
      ENTITIES.COMMAND_PROJECT_SELECTION
    );

    const res = await slackService.openModal(data.trigger_id, modal);
    if (res && !res.ok) {
      logger.error("Something went wrong while opening the modal", res);
    }
  } catch (error: any) {
    const isPermissionError = error?.detail?.includes(CONSTANTS.NO_PERMISSION_ERROR);
    const errorMessage = isPermissionError ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE : CONSTANTS.SOMETHING_WENT_WRONG;

    await slackService.sendEphemeralMessage(data.user_id, errorMessage, data.channel_id);
  }
};
