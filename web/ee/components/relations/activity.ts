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
        ? `marked this work item to start before `
        : `removed the start before relation from work item `;
    case "start_after":
      return activity.old_value === ""
        ? `marked this work item to start after `
        : `removed the start after relation from work item `;
    case "finish_before":
      return activity.old_value === ""
        ? `marked this work item to finish before `
        : `removed the finish before relation from work item `;
    case "finish_after":
      return activity.old_value === ""
        ? `marked this work item to finish after `
        : `removed the finish after relation from work item `;
  }

  return;
};
