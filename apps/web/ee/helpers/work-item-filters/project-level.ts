// ce imports
import { TGetAdditionalPropsForProjectLevelFiltersHOC } from "@/ce/helpers/work-item-filters/project-level";
// store imports
import { store } from "@/lib/store-context";

export const getAdditionalProjectLevelFiltersHOCProps: TGetAdditionalPropsForProjectLevelFiltersHOC = ({
  workspaceSlug,
  projectId,
}) => ({
  workItemTypeIds: store.issueTypes.isWorkItemTypeEnabledForProject(workspaceSlug, projectId)
    ? store.issueTypes.getProjectIssueTypeIds(projectId)
    : undefined,
});
