import { TBlockActionModalPayload, TBlockActionPayload } from "types/slack";
import { handleProjectSelectAction } from "./blockActions/handle-project-select-action";

export const handleBlockAction = async (
  payload: TBlockActionPayload,
): Promise<boolean> => {
  switch (payload.actions[0].action_id) {
    case "project-select-action":
      // When a user selects a project from the dropdown in create issue, this is the action that is triggered.
      return await handleProjectSelectAction(
        payload as TBlockActionModalPayload,
      );
    default:
      return false;
  }
};
