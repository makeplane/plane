import { FC, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter, useSearchParams } from "next/navigation";
// constants
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
// hooks
import { useIssue, useIssueFilter, useProject } from "@/hooks/store";
// types
import { IIssueFilterOptions } from "@/types/issue";
// components
import { FiltersDropdown } from "./helpers/dropdown";
import { FilterSelection } from "./selection";

type IssueFiltersDropdownProps = {
  workspaceSlug: string;
  projectId: string;
};

export const IssueFiltersDropdown: FC<IssueFiltersDropdownProps> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  const searchParams = useSearchParams();
  const router = useRouter();
  // store hooks
  const { activeLayout } = useProject();
  const { states, labels } = useIssue();
  const { issueFilters, updateFilters } = useIssueFilter();

  const updateRouteParams = useCallback(
    (key: keyof IIssueFilterOptions, value: string[]) => {
      const state = key === "state" ? value : issueFilters?.filters?.state ?? [];
      const priority = key === "priority" ? value : issueFilters?.filters?.priority ?? [];
      const labels = key === "labels" ? value : issueFilters?.filters?.labels ?? [];

      let params: any = { board: activeLayout || "list" };
      if (priority.length > 0) params = { ...params, priorities: priority.join(",") };
      if (state.length > 0) params = { ...params, states: state.join(",") };
      if (labels.length > 0) params = { ...params, labels: labels.join(",") };
      console.log("params", params);
      router.push(`/${workspaceSlug}/${projectId}?${searchParams}`);
    },
    [workspaceSlug, projectId, activeLayout, issueFilters, router]
  );

  const handleFilters = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!projectId) return;
      const newValues = issueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
        });
      } else {
        if (issueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateFilters(projectId, { [key]: newValues });
      updateRouteParams(key, newValues);
    },
    [projectId, issueFilters, updateFilters, updateRouteParams]
  );

  return (
    <div className="z-10 flex h-full w-full flex-col">
      <FiltersDropdown title="Filters" placement="bottom-end">
        <FilterSelection
          filters={issueFilters?.filters ?? {}}
          handleFilters={handleFilters as any}
          layoutDisplayFiltersOptions={activeLayout ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeLayout] : undefined}
          states={states ?? undefined}
          labels={labels ?? undefined}
        />
      </FiltersDropdown>
    </div>
  );
});
