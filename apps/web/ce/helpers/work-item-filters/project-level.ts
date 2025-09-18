import { TWorkItemFiltersEntityProps } from "@/plane-web/hooks/work-item-filters/use-work-item-filters-config";

export type TGetAdditionalPropsForProjectLevelFiltersHOCParams = {
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
