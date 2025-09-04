import { PlaneWebhookPayloadBase, ExIssue, ExIssueComment } from "@plane/sdk";
import { getIssueUrlFromSequenceId } from "@/helpers/urls";
import { isUUID, titleCase } from "@/helpers/utils";
import { ActivityForSlack } from "../types/types";
import { getUserMarkdown } from "./user";

type ActivityFormatterContext = {
  workspaceSlug: string;
  userMap: Map<string, string>;
  activity: ActivityForSlack;
  fieldText: string; // Pre-formatted field name
};

type ActivityFormatter = (context: ActivityFormatterContext) => string;

// Define custom formatters for specific fields
const ACTIVITY_FORMATTERS: Record<string, ActivityFormatter> = {
  /**
   * Formats assignee changes showing added/removed users with mentions
   * @example
   * // Returns:
   * // > *Assignees*:
   * // >  - Added <@U1234|john.doe>, <@U5678|jane.smith>
   * // >  - Removed <@U9999|old.user>
   */
  assignees: ({ activity, fieldText, userMap, workspaceSlug }) => {
    if (!activity.isArrayField) return "";

    let changeText = `> *${fieldText}*:\n`;

    if (activity.addedIdentifiers?.length > 0) {
      const addedUsers = activity.addedIdentifiers
        .map((id, index) => getUserMarkdown(userMap, workspaceSlug, id, activity.added[index]))
        .join(", ");
      changeText += `>  - Added ${addedUsers}\n`;
    }

    if (activity.removedIdentifiers?.length > 0) {
      const removedUsers = activity.removedIdentifiers
        .map((id, index) => getUserMarkdown(userMap, workspaceSlug, id, activity.removed[index]))
        .join(", ");
      changeText += `>  - Removed ${removedUsers}\n`;
    }

    return changeText;
  },

  /**
   * Formats parent issue changes with URL linking to the parent issue
   * @example
   * // Returns:
   * // "Added parent <https://app.plane.so/workspace/project/issues/ABC-123|ABC-123>"
   * // or for invalid format:
   * // "Added parent INVALID-ID"
   */
  parent: ({ activity, workspaceSlug }) => {
    if (activity.isArrayField) return "";

    if (!activity.newValue) return "";

    const parts = activity.newValue.split("-");
    if (parts.length === 2) {
      const projectId = parts[0];
      const issueId = parts[1];
      return `Added parent <${getIssueUrlFromSequenceId(workspaceSlug, projectId, issueId)}|${activity.newValue}>`;
    }

    return `Added parent ${activity.newValue}`;
  },

  /**
   * Formats priority changes with title case formatting and strikethrough for old values
   * @example
   * // Returns:
   * // "> *Priority*:  ~High~ → Medium\n" (when changing priority)
   * // "> *Priority*: removed ~Low~\n" (when removing priority)
   * // "> *Priority*: High\n" (when setting new priority)
   */
  priority: ({ activity, fieldText }) => {
    if (activity.isArrayField) return "";

    const oldValue = activity.oldValue ? titleCase(activity.oldValue) : null;
    const newValue = activity.newValue ? titleCase(activity.newValue) : null;

    if (oldValue && newValue) {
      return `> *${fieldText}*:  ~${oldValue}~ → ${newValue}\n`;
    } else if (oldValue && !newValue) {
      return `> *${fieldText}*: removed ~${oldValue}~\n`;
    }

    return `> *${fieldText}*: ${newValue}\n`;
  },
};

// Default formatters for array and single fields
/**
 * Default formatter for array fields showing added/removed items
 * @example
 * // Returns:
 * // > *Labels*:
 * // >  - Added _bug, critical_
 * // >  - Removed _enhancement_
 */
const formatArrayFieldDefault = ({ activity, fieldText }: ActivityFormatterContext): string => {
  if (!activity.isArrayField) return "";
  if (activity.added.length === 0 && activity.removed.length === 0) return "";

  let changeText = `> *${fieldText}*:\n`;

  if (activity.added.length > 0) {
    changeText += `>  - Added _${activity.added.join(", ")}_\n`;
  }

  if (activity.removed.length > 0) {
    changeText += `>  - Removed _${activity.removed.join(", ")}_\n`;
  }

  return changeText;
};

/**
 * Default formatter for single fields with old/new value changes
 * @example
 * // Returns:
 * // "> *Status*:  ~In Progress~ → Done\n" (when changing value)
 * // "> *Status*: removed ~Done~\n" (when removing value)
 * // "> *Status*: In Progress\n" (when setting new value)
 */
const formatSingleFieldDefault = ({ activity, fieldText }: ActivityFormatterContext): string => {
  if (activity.isArrayField) return "";

  if (activity.oldValue && activity.newValue) {
    return `> *${fieldText}*:  ~${activity.oldValue}~ → ${activity.newValue}\n`;
  } else if (activity.oldValue && !activity.newValue) {
    return `> *${fieldText}*: removed ~${activity.oldValue}~\n`;
  }

  return `> *${fieldText}*: ${activity.newValue}\n`;
};

export const formatActivityValue = (
  workspaceSlug: string,
  userMap: Map<string, string>,
  activity: ActivityForSlack
) => {
  const formatFieldName = (fieldName: string) =>
    fieldName
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const fieldText = formatFieldName(activity.field);
  const context: ActivityFormatterContext = {
    workspaceSlug,
    userMap,
    activity,
    fieldText,
  };

  // Check if we have a custom formatter for this field
  const customFormatter = ACTIVITY_FORMATTERS[activity.field];
  if (customFormatter) {
    return customFormatter(context);
  }

  // Fall back to default formatters
  if (activity.isArrayField) {
    return formatArrayFieldDefault(context);
  } else {
    return formatSingleFieldDefault(context);
  }
};

export const isValidIssueUpdateActivity = (payload: PlaneWebhookPayloadBase<ExIssue | ExIssueComment>) =>
  payload.activity.field &&
  !payload.activity.field.includes("_id") &&
  !isUUID(payload.activity.old_value) &&
  !isUUID(payload.activity.new_value);
