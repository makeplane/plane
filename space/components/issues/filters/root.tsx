import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { FiltersDropdown } from "./helpers/dropdown";
import { FilterSelection } from "./selection";
// types
import { IIssueFilterOptions } from "store/issues/types";
// helpers
import { ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "store/issues/helpers";
// store
import { RootStore } from "store/root";
import { useMobxStore } from "lib/mobx/store-provider";

export const IssueFiltersDropdown: FC = observer(() => {
  const router = useRouter();
  const { workspace_slug: workspaceSlug, project_slug: projectId } = router.query as {
    workspace_slug: string;
    project_slug: string;
  };

  const {
    project: { activeBoard },
    issue: { states, labels },
    issuesFilter: { issueFilters, updateFilters },
  }: RootStore = useMobxStore();

  const updateRouteParams = useCallback(
    (key: keyof IIssueFilterOptions, value: string[]) => {
      const state = key === "state" ? value : issueFilters?.filters?.state ?? [];
      const priority = key === "priority" ? value : issueFilters?.filters?.priority ?? [];
      const labels = key === "labels" ? value : issueFilters?.filters?.labels ?? [];

      let params: any = { board: activeBoard || "list" };
      if (priority.length > 0) params = { ...params, priorities: priority.join(",") };
      if (state.length > 0) params = { ...params, states: state.join(",") };
      if (labels.length > 0) params = { ...params, labels: labels.join(",") };

      router.push({ pathname: `/${workspaceSlug}/${projectId}`, query: { ...params } }, undefined, { shallow: true });
    },
    [workspaceSlug, projectId, activeBoard, issueFilters, router]
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
          handleFilters={handleFilters}
          layoutDisplayFiltersOptions={activeBoard ? ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[activeBoard] : undefined}
          states={states ?? undefined}
          labels={labels ?? undefined}
        />
      </FiltersDropdown>
    </div>
  );
});
