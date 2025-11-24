// plane imports
import type { EIssuesStoreType } from "@plane/types";
// plane web imports
import type { TWorkItemFiltersEntityProps } from "@/plane-web/hooks/work-item-filters/use-work-item-filters-config";

export type TGetAdditionalPropsForProjectLevelFiltersHOCParams = {
  entityType: EIssuesStoreType;
  workspaceSlug: string;
  projectId: string;
};

export type TGetAdditionalPropsForProjectLevelFiltersHOC = (
  params: TGetAdditionalPropsForProjectLevelFiltersHOCParams
) => TWorkItemFiltersEntityProps;

export const getAdditionalProjectLevelFiltersHOCProps: TGetAdditionalPropsForProjectLevelFiltersHOC = ({
  workspaceSlug,
}) => ({
  workspaceSlug,
});
