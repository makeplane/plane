// types
import { TShouldRenderDisplayProperty } from "@/ce/helpers/issue-filter.helper";
// lib
import { store } from "@/lib/store-context";

export const shouldRenderDisplayProperty = (props: TShouldRenderDisplayProperty) => {
  const { workspaceSlug, projectId, key } = props;
  // plane web store
  const isWorkItemTypeEnabled = projectId
    ? store.issueTypes.isWorkItemTypeEnabledForProject(workspaceSlug?.toString(), projectId?.toString())
    : store.featureFlags.flags[workspaceSlug]?.ISSUE_TYPES;

  switch (key) {
    case "issue_type":
      return isWorkItemTypeEnabled;
    default:
      return true;
  }
};
