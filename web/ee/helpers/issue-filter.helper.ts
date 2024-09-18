// types
import { TShouldRenderDisplayProperty } from "@/ce/helpers/issue-filter.helper";
// lib
import { store } from "@/lib/store-context";

export const shouldRenderDisplayProperty = (props: TShouldRenderDisplayProperty) => {
  const { workspaceSlug, projectId, key } = props;
  // plane web store
  const isIssueTypeDisplayEnabled = projectId
    ? store.issueTypes.isIssueTypeEnabledForProject(
        workspaceSlug?.toString(),
        projectId?.toString(),
        "ISSUE_TYPE_DISPLAY"
      )
    : store.featureFlags.flags[workspaceSlug]?.ISSUE_TYPE_DISPLAY;

  switch (key) {
    case "issue_type":
      return isIssueTypeDisplayEnabled;
    default:
      return true;
  }
};
