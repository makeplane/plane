import { MQSingleton } from "mq/singleton";
import { TViewSubmissionPayload } from "../../../types/slack";
import { parseCreateIssueModalSubmission } from "../../../utils/slack/convert-create-issue-submission";

export const handleModalViewSubmission = async (
  payload: TViewSubmissionPayload,
): Promise<boolean> => {
  const stateValues = payload.view.state.values;

  if (!stateValues) {
    return false;
  }

  const submissionData = parseCreateIssueModalSubmission(stateValues);

  const mq = MQSingleton.getInstance();

  console.log(submissionData);

  return true;
};
