import { ExIntakeIssue, IssueWithExpanded } from "@plane/sdk";

import { getUserMarkdown } from "./user";

export enum E_MUTATION_CONTEXT_ITEM_TYPE {
  WORK_ITEM = "work item",
  INTAKE = "intake"
}

export enum E_MUTATION_CONTEXT_FORMAT_TYPE {
  CREATION_ONLY = "creation-only",
  CREATION_AND_UPDATE = "creation-and-update",
  UPDATE_ONLY = "update-only"
}

export const createSlackLinkbackMutationContext = (params: {
  issue: Pick<ExIntakeIssue | IssueWithExpanded<any>, "created_by" | "updated_by">;
  planeToSlackUserMap: Map<string, string>;
  workspaceSlug: string;
  options?: {
    itemType?: E_MUTATION_CONTEXT_ITEM_TYPE;
    showUpdateInfo?: boolean;
    format?: E_MUTATION_CONTEXT_FORMAT_TYPE;
  };
}) => {
  const { issue, planeToSlackUserMap, workspaceSlug, options = {} } = params;
  const {
    itemType = E_MUTATION_CONTEXT_ITEM_TYPE.WORK_ITEM,
    showUpdateInfo = false,
    format = E_MUTATION_CONTEXT_FORMAT_TYPE.CREATION_ONLY,
  } = options;

  // Handle update-only format
  if (format === E_MUTATION_CONTEXT_FORMAT_TYPE.UPDATE_ONLY) {
    if (!issue.updated_by) {
      return ""; // Return empty string if no update info available
    }

    const updateUser = getUserMarkdown(planeToSlackUserMap, workspaceSlug, issue.updated_by);
    return `*${updateUser} updated this ${itemType}*`;
  }

  // Determine the user to display (prefer created_by, fallback to updated_by)
  const user = issue.created_by
    ? getUserMarkdown(planeToSlackUserMap, workspaceSlug, issue.created_by)
    : issue.updated_by
      ? getUserMarkdown(planeToSlackUserMap, workspaceSlug, issue.updated_by)
      : "Unknown User";


  let content = `*${user} ${itemType === E_MUTATION_CONTEXT_ITEM_TYPE.INTAKE ? "created" : "added"} this ${itemType}*`;

  // Add update information if requested and available
  if (format === E_MUTATION_CONTEXT_FORMAT_TYPE.CREATION_AND_UPDATE && showUpdateInfo && issue.updated_by) {
    const updateUser = getUserMarkdown(planeToSlackUserMap, workspaceSlug, issue.updated_by);
    content += `\n*${updateUser} updated this ${itemType}*`;
  }

  return content;
};
