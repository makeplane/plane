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
  const isCustomersFeatureEnabled = store.customersStore.isCustomersFeatureEnabled;

  switch (key) {
    case "issue_type":
      return isWorkItemTypeEnabled;
    case "customer_count":
      return isCustomersFeatureEnabled;
    case "customer_request_count":
      return isCustomersFeatureEnabled;
    default:
      return true;
  }
};

export const shouldRenderColumn = (key: string): boolean => {
  const isEstimateEnabled = store.projectRoot.project.currentProjectDetails?.estimate !== null;
  const isCustomersFeatureEnabled = store.customersStore.isCustomersFeatureEnabled;
  switch (key) {
    case "estimate":
      return isEstimateEnabled;
    case "customer_count":
      return !!isCustomersFeatureEnabled;
    case "customer_request_count":
      return !!isCustomersFeatureEnabled;
    default:
      return true;
  }
};
