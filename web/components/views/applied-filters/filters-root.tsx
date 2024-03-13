import { FC } from "react";
// components
import { ViewAppliedFiltersItemMap } from "./";
// types
import { IIssueFilterOptions } from "@plane/types";

type TViewAppliedFilters = {
  workspaceSlug: string;
  projectId: string;
  filters: Partial<Record<keyof IIssueFilterOptions, string[] | undefined | null>>;
};

export const ViewAppliedFilters: FC<TViewAppliedFilters> = (props) => {
  const { workspaceSlug, projectId, filters } = props;

  if (filters && Object.keys(filters).length <= 0)
    return (
      <div className="text-xs bg-custom-primary-100/20 rounded relative flex items-center gap-1 p-1 px-2">
        <div className="whitespace-nowrap">0 Filters</div>
      </div>
    );

  return (
    <div className="relative flex items-center gap-2 flex-wrap">
      {Object.entries(filters || {}).map(([key, value]) => (
        <ViewAppliedFiltersItemMap
          key={key}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          filterKey={key as keyof IIssueFilterOptions}
          filterValue={value || []}
        />
      ))}
    </div>
  );
};
