import { convertToSlackOptions } from "@/apps/slack/helpers/slack-options";
import { createProjectSelectionModal } from "@/apps/slack/views";
import { TMessageActionPayload } from "@silo/slack";
import { getConnectionDetails } from "../../helpers/connection-details";

export const handleMessageAction = async (data: TMessageActionPayload) => {
  // Get the workspace connection for the associated team
  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);

  const projects = await planeClient.project.list(workspaceConnection.workspaceSlug);
  const filteredProjects = projects.results.filter((project) => project.is_member === true);
  // @ts-ignore
  const plainTextOptions = convertToSlackOptions(filteredProjects);
  const modal = createProjectSelectionModal(plainTextOptions, JSON.stringify(data));

  try {
    const res = await slackService.openModal(data.trigger_id, modal);
    if (res && !res.ok) {
      console.log("Something went wrong while opening the modal", res);
    }
  } catch (error) {
    console.log(error);
  }
};
