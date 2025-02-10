import { TSlackCommandPayload } from "@plane/etl/slack";
import { getConnectionDetails } from "../../helpers/connection-details";
import { ENTITIES } from "../../helpers/constants";
import { convertToSlackOptions } from "../../helpers/slack-options";
import { createProjectSelectionModal } from "../../views";

export const handleCommand = async (data: TSlackCommandPayload) => {
  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team_id);

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
    ENTITIES.COMMAND_PROJECT_SELECTION
  );

  try {
    const res = await slackService.openModal(data.trigger_id, modal);
    if (res && !res.ok) {
      console.log("Something went wrong while opening the modal", res);
    }
  } catch (error) {
    console.log(error);
  }
};
