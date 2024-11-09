import { TIssueActivity } from "@plane/types";

export const getRelationActivityContent = (activity: TIssueActivity | undefined): string | undefined => {
  if (!activity) return;

  switch (activity.field) {
    case "blocking":
      return activity.old_value === "" ? `marked this issue is blocking issue ` : `removed the blocking issue `;
    case "blocked_by":
      return activity.old_value === ""
        ? `marked this issue is being blocked by `
        : `removed this issue being blocked by issue `;
    case "duplicate":
      return activity.old_value === "" ? `marked this issue as duplicate of ` : `removed this issue as a duplicate of `;
    case "relates_to":
      return activity.old_value === "" ? `marked that this issue relates to ` : `removed the relation from `;
  }

  return;
};
