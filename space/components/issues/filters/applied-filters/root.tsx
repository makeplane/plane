"use client";

import { FC, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
// hooks
import { useIssue, useProject, useIssueFilter } from "@/hooks/store";
// store
import { IIssueFilterOptions } from "@/types/issue";
// components
import { AppliedFiltersList } from "./filters-list";

// TODO: fix component types
export const IssueAppliedFilters: FC = observer((props: any) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = props;
  const { states, labels } = useIssue();
  const { activeLayout } = useProject();
  const { issueFilters, updateFilters } = useIssueFilter();

  const userFilters = issueFilters?.filters || {};

  const appliedFilters: any = {};

  Object.entries(userFilters).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    appliedFilters[key] = value;
  });

  const updateRouteParams = useCallback(
    (key: keyof IIssueFilterOptions | null, value: string[] | null, clearFields: boolean = false) => {
      const state = key === "state" ? value || [] : issueFilters?.filters?.state ?? [];
      const priority = key === "priority" ? value || [] : issueFilters?.filters?.priority ?? [];
      const labels = key === "labels" ? value || [] : issueFilters?.filters?.labels ?? [];

      let params: any = { board: activeLayout || "list" };
      if (!clearFields) {
        if (priority.length > 0) params = { ...params, priorities: priority.join(",") };
        if (state.length > 0) params = { ...params, states: state.join(",") };
        if (labels.length > 0) params = { ...params, labels: labels.join(",") };
      }
      console.log("params", params);
      // TODO: fix this redirection
      // router.push({ pathname: `/${workspaceSlug}/${projectId}`, query: { ...params } }, undefined, { shallow: true });
    },
    [workspaceSlug, projectId, activeLayout, issueFilters, router]
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
        handleRemoveFilter={handleRemoveFilter as any}
        handleRemoveAllFilters={handleRemoveAllFilters}
        labels={labels ?? []}
        states={states ?? []}
      />
    </div>
  );
});
