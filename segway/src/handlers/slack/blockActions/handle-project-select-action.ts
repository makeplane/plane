import { ProjectService } from "../../../services/project.service";
import { SlackService } from "../../../services/slack.service";
import { TBlockActionModalPayload } from "../../../types/slack";
import { priority } from "../../../utils/constants";
import { logger } from "../../../utils/logger";
import {
  convertToSlackOption,
  convertToSlackOptions,
} from "../../../utils/slack/convert-to-slack-options";
import { CreateIssueModalViewFull } from "../../../utils/slack/create-issue-modal";

export const handleProjectSelectAction = async (
  payload: TBlockActionModalPayload,
) => {
  try {
    const slackService = new SlackService(),
      projectService = new ProjectService();

    const teamId = payload.team.id;
    const workspaceId = await slackService.getWorkspaceId(teamId);

    if (!payload.actions[0].selected_option || !workspaceId) {
      return false;
    }

    const viewId = payload.view.id,
      selectedProjectId = payload.actions[0].selected_option.value,
      selectedProjectTitle = payload.actions[0].selected_option.text.text;

    const states = await projectService.getProjectStates(selectedProjectId),
      members = await projectService.getProjectMembers(selectedProjectId),
      labels = await projectService.getProjectLabels(selectedProjectId),
      projectList = await projectService.getProjectsForWorkspace(workspaceId);

    if (!states || !members || !labels || !projectList) {
      return false;
    }

    // convert to slack options
    const selectedProjectOption = convertToSlackOption({
      id: selectedProjectId,
      name: selectedProjectTitle,
    });

    const projectOptions = convertToSlackOptions(projectList);
    const stateOptions = convertToSlackOptions(states);
    const labelOptions = convertToSlackOptions(labels);
    const priorityOptions = priority.map((p) =>
      convertToSlackOption({ id: p, name: p.toUpperCase() }),
    );
    const assigneeOptions = members.map((m) =>
      convertToSlackOption({
        id: m.member === null ? "" : m.member.id,
        name:
          m.member === null ? "" : m.member.firstName + " " + m.member.lastName,
      }),
    );

    const updatedModalView = CreateIssueModalViewFull({
      projectOptions,
      stateOptions,
      labelOptions,
      priorityOptions,
      assigneeOptions,
      selectedProject: selectedProjectOption,
    });

    const response = await slackService.updateModal(viewId, updatedModalView);
    if (response?.status !== 200) {
      return false;
    }

    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
};
