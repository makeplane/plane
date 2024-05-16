"use client";

import { FC, useCallback } from "react";
import cloneDeep from "lodash/cloneDeep";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
// components
import { FiltersDropdown } from "@/components/issues/filters/helpers/dropdown";
import { FilterSelection } from "@/components/issues/filters/selection";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
// helpers
import { queryParamGenerator } from "@/helpers/query-param-generator";
// hooks
import { useIssue, useIssueFilter } from "@/hooks/store";
// types
import { TIssueQueryFilters } from "@/types/issue";

type IssueFiltersDropdownProps = {
  workspaceSlug: string;
  projectId: string;
};

export const IssueFiltersDropdown: FC<IssueFiltersDropdownProps> = observer((props) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = props;
  // hooks
  const { issueFilters, updateIssueFilters } = useIssueFilter();
  const { states, labels } = useIssue();

  const activeLayout = issueFilters?.display_filters?.layout || undefined;

  const updateRouteParams = useCallback(
    (key: keyof TIssueQueryFilters, value: string[]) => {
      const state = key === "state" ? value : issueFilters?.filters?.state ?? [];
      const priority = key === "priority" ? value : issueFilters?.filters?.priority ?? [];
      const labels = key === "labels" ? value : issueFilters?.filters?.labels ?? [];

      const queryGenerated = queryParamGenerator({ board: activeLayout, priority, state, labels });
      router.push(`/${workspaceSlug}/${projectId}?${queryGenerated?.queryParam}`);
    },
    [workspaceSlug, projectId, activeLayout, issueFilters, router]
  );

  const handleFilters = useCallback(
    (key: keyof TIssueQueryFilters, value: string) => {
      if (!projectId || !value) return;

      const newValues = cloneDeep(issueFilters?.filters?.[key]) ?? [];

      if (newValues.includes(value)) newValues.splice(newValues.indexOf(value), 1);
      else newValues.push(value);

      updateIssueFilters(projectId, "filters", key, newValues);
      updateRouteParams(key, newValues);
    },
    [projectId, issueFilters, updateIssueFilters, updateRouteParams]
  );

  return (
    <div className="z-10 flex h-full w-full flex-col">
      <FiltersDropdown title="Filters" placement="bottom-end">
        <FilterSelection
          filters={issueFilters?.filters ?? {}}
          handleFilters={handleFilters as any}
          layoutDisplayFiltersOptions={activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT?.[activeLayout]?.filters : []}
          states={states ?? undefined}
          labels={labels ?? undefined}
        />
      </FiltersDropdown>
    </div>
  );
});
