import { TSlackCommandPayload } from "@plane/etl/slack";
import { getConnectionDetails } from "../../helpers/connection-details";
import { createProjectSelectionModal } from "../../views";
import { convertToSlackOptions } from "../../helpers/slack-options";
import { ENTITIES } from "../../helpers/constants";

export const handleCommand = async (data: TSlackCommandPayload) => {
  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team_id);

  const projects = await planeClient.project.list(workspaceConnection.workspaceSlug);
  const filteredProjects = projects.results.filter((project) => project.is_member === true);
  // @ts-ignore
  const plainTextOptions = convertToSlackOptions(filteredProjects);
  const modal = createProjectSelectionModal(plainTextOptions, data, ENTITIES.COMMAND_PROJECT_SELECTION);

  try {
    const res = await slackService.openModal(data.trigger_id, modal);
    if (res && !res.ok) {
      console.log("Something went wrong while opening the modal", res);
    }
  } catch (error) {
    console.log(error);
  }
};
