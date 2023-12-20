import { handleBlockAction } from "./block-action-handler";
import { handleViewClosed } from "./view-close-handler";
import { handleViewSubmission } from "./view-submission-handler";

export const processSlackPayload = async (payload: any): Promise<boolean> => {
  switch (payload.type) {
    case "block_actions":
      return await handleBlockAction(payload);
    case "view_submission":
      return await handleViewSubmission(payload);
    case "view_closed":
      return await handleViewClosed(payload);
    default:
      return false;
  }
};
