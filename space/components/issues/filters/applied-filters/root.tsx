import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// components
import { AppliedFiltersList } from "./filters-list";
// store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
import { IIssueFilterOptions } from "store/issues/types";

export const IssueAppliedFilters: FC = observer(() => {
  const router = useRouter();
  const { workspace_slug: workspaceSlug, project_slug: projectId } = router.query as {
    workspace_slug: string;
    project_slug: string;
  };

  const {
    issuesFilter: { issueFilters, updateFilters },
    issue: { states, labels },
    project: { activeBoard },
  }: RootStore = useMobxStore();

  const userFilters = issueFilters?.filters || {};

  const appliedFilters: IIssueFilterOptions = {};
  Object.entries(userFilters).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const updateRouteParams = useCallback(
    (key: keyof IIssueFilterOptions | null, value: string[] | null, clearFields: boolean = false) => {
      const state = key === "state" ? value || [] : issueFilters?.filters?.state ?? [];
      const priority = key === "priority" ? value || [] : issueFilters?.filters?.priority ?? [];
      const labels = key === "labels" ? value || [] : issueFilters?.filters?.labels ?? [];

      let params: any = { board: activeBoard || "list" };
      if (!clearFields) {
        if (priority.length > 0) params = { ...params, priorities: priority.join(",") };
        if (state.length > 0) params = { ...params, states: state.join(",") };
        if (labels.length > 0) params = { ...params, labels: labels.join(",") };
      }

      router.push({ pathname: `/${workspaceSlug}/${projectId}`, query: { ...params } }, undefined, { shallow: true });
    },
    [workspaceSlug, projectId, activeBoard, issueFilters, router]
  );

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    if (!projectId) return;
    if (!value) {
      updateFilters(projectId, { [key]: null });
      return;
    }

    let newValues = issueFilters?.filters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    updateFilters(projectId, { [key]: newValues });
    updateRouteParams(key, newValues);
  };

  const handleRemoveAllFilters = () => {
    if (!projectId) return;

    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = null;
    });

    updateFilters(projectId, { ...newFilters });
    updateRouteParams(null, null, true);
  };

  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="border-b border-custom-border-200 p-5 py-3">
      <AppliedFiltersList
        appliedFilters={appliedFilters || {}}
        handleRemoveFilter={handleRemoveFilter}
        handleRemoveAllFilters={handleRemoveAllFilters}
        labels={labels ?? []}
        states={states ?? []}
      />
    </div>
  );
});
