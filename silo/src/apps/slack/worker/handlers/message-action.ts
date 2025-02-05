import { TMessageActionPayload } from "@plane/etl/slack";
import { convertToSlackOptions } from "@/apps/slack/helpers/slack-options";
import { createProjectSelectionModal } from "@/apps/slack/views";
import { getConnectionDetails } from "../../helpers/connection-details";

export const handleMessageAction = async (data: TMessageActionPayload) => {
  // Get the workspace connection for the associated team
  const { workspaceConnection, slackService, planeClient } = await getConnectionDetails(data.team.id);

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
      console.log("Something went wrong while opening the modal", res);
    }
  } catch (error) {
    console.log(error);
  }
};
