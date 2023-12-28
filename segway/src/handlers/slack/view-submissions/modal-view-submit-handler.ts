import { MQSingleton } from "../../../mq/singleton";
import { TViewSubmissionPayload } from "../../../types/slack";
import { parseCreateIssueModalSubmission } from "../../../utils/slack/convert-create-issue-submission";
import { SlackService } from "../../../services/slack.service";

export const handleModalViewSubmission = async (
  payload: TViewSubmissionPayload,
): Promise<boolean> => {
  const stateValues = payload.view.state.values;

  if (!stateValues) {
    return false;
  }

  const submissionData = parseCreateIssueModalSubmission(stateValues);
  const slackService = new SlackService();

  const userInfoResponse = await slackService.getUserInfo(payload.user.id);

  if (!userInfoResponse) {
    return false;
  }

  const displayedUser = await userInfoResponse?.json();

  const workspace_id = await slackService.getWorkspaceId(payload.team.id);

  const mq = MQSingleton.getInstance();

  const issueSync = {
    args: [], // args
    kwargs: {
      data: {
        type: "slack.create_issue",
        title: submissionData.issueTitle,
        description: submissionData.issueDescription,
        priority: submissionData.priority,
        state_id: submissionData.state?.id,
        assignees: submissionData.assignees ?? [],
        created_by: {
          email: displayedUser?.user?.profile?.email,
          name: displayedUser?.user?.name,
        },
        workspace_id: workspace_id,
        project_id: submissionData.project?.id,
      },
    },
  };

  if (!mq) {
    return false;
  }
  // Push the issue
  await mq?.publish(issueSync, "plane.bgtasks.importer_task.import_task");

  await slackService.sendEphemeralMessage(
    payload.user.id,
    "Successfully created issue",
  );

  return true;
};
