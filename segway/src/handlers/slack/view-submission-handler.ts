import { TViewSubmissionPayload } from "../../types/slack";
import { handleModalViewSubmission } from "./view-submissions/modal-view-submit-handler";

export const handleViewSubmission = async (
  payload: TViewSubmissionPayload,
): Promise<boolean> => {
  switch (payload.view.type) {
    case "modal":
      return await handleModalViewSubmission(payload);
    default:
      return false;
  }
};
