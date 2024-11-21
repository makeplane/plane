import { TIssueActivity } from "@plane/types";
import { getRelationActivityContent as getCERelationActivityContent } from "ce/components/relations";

export const getRelationActivityContent = (activity: TIssueActivity | undefined): string | undefined => {
  if (!activity) return;

  if (["blocking", "blocked_by", "duplicate", "relates_to"].includes(activity.field ?? "")) {
    return getCERelationActivityContent(activity);
  }

  switch (activity.field) {
    case "start_before":
      return activity.old_value === ""
        ? `marked this issue to start before `
        : `removed the start before relation from issue `;
    case "start_after":
      return activity.old_value === ""
        ? `marked this issue to start after `
        : `removed the start after relation from issue `;
    case "finish_before":
      return activity.old_value === ""
        ? `marked this issue to finish before `
        : `removed the finish before relation from issue `;
    case "finish_after":
      return activity.old_value === ""
        ? `marked this issue to finish after `
        : `removed the finish after relation from issue `;
  }

  return;
};
