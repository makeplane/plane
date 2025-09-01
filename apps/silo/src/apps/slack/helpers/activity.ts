import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import { ActivityForSlack } from "../types/types";
import { getUserMarkdown } from "./user";

export const formatActivityValue = (
  workspaceSlug: string,
  userMap: Map<string, string>,
  activity: ActivityForSlack
) => {
  const titleCaseWord = (word: string) =>
    word
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const formatFieldName = (fieldName: string) =>
    fieldName
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  let changeText = "";
  const fieldText = formatFieldName(activity.field);

  if (activity.isArrayField === true) {
    if (activity.added.length > 0 || activity.removed.length > 0) {
      changeText += `> *${fieldText}*:\n`;
      if (activity.added.length > 0) {
        changeText += `>  - Added _${activity.added.join(", ")}_\n`;
      }
      if (activity.removed.length > 0) {
        changeText += `>  - Removed _${activity.removed.join(", ")}_\n`;
      }
    }

    return changeText;
  } else {
    if (activity.field === "reaction") {
      const emoji = String.fromCodePoint(parseInt(activity.newValue));
      return `${getUserMarkdown(userMap, workspaceSlug, activity.actorId, activity.actorDisplayName)} reacted with ${emoji}`;
    }

    if (activity.field === "parent" && activity.newValue) {
      const parts = activity.newValue.split("-");
      if (parts.length === 2) {
        const projectId = parts[0];
        const issueId = parts[1];
        return `Added parent <${getIssueUrlFromSequenceId(workspaceSlug, projectId, issueId)}|${activity.newValue}>`;
      }

      return `Added parent ${activity.newValue}`;
    }

    if (activity.field === "priority") {
      if (activity.oldValue) {
        activity.oldValue = titleCaseWord(activity.oldValue);
      }
      if (activity.newValue) {
        activity.newValue = titleCaseWord(activity.newValue);
      }
    }

    if (activity.oldValue && activity.newValue) {
      return `> *${fieldText}*:  ~${activity.oldValue}~ → ${activity.newValue}\n`;
    } else if (activity.oldValue && !activity.newValue) {
      return `> *${fieldText}*: removed ~${activity.oldValue}~\n`;
    }

    return `> *${fieldText}*: ${activity.newValue}\n`;
  }
};
