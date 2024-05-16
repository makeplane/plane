"use client";

import { FC, useCallback } from "react";
import cloneDeep from "lodash/cloneDeep";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
// hooks
import { useIssue, useIssueFilter } from "@/hooks/store";
// types
import { TIssueQueryFilters } from "@/types/issue";
// components
import { FiltersDropdown } from "./helpers/dropdown";
import { FilterSelection } from "./selection";

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

      let params: any = { board: activeLayout || "list" };
      if (priority.length > 0) params = { ...params, priority: priority.join(",") };
      if (state.length > 0) params = { ...params, state: state.join(",") };
      if (labels.length > 0) params = { ...params, labels: labels.join(",") };
      params = new URLSearchParams(params).toString();

      router.push(`/${workspaceSlug}/${projectId}?${params}`);
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
