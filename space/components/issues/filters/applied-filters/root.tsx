"use client";

import { FC, useCallback } from "react";
import cloneDeep from "lodash/cloneDeep";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
// hooks
import { useIssue, useIssueFilter } from "@/hooks/store";
// store
import { TIssueQueryFilters } from "@/types/issue";
// components
import { AppliedFiltersList } from "./filters-list";

type TIssueAppliedFilters = {
  workspaceSlug: string;
  projectId: string;
};

export const IssueAppliedFilters: FC<TIssueAppliedFilters> = observer((props) => {
  const router = useRouter();
  // props
  const { workspaceSlug, projectId } = props;
  // hooks
  const { issueFilters, initIssueFilters, updateIssueFilters } = useIssueFilter();
  const { states, labels } = useIssue();

  const activeLayout = issueFilters?.display_filters?.layout || undefined;
  const userFilters = issueFilters?.filters || {};

  const appliedFilters: any = {};
  Object.entries(userFilters).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    appliedFilters[key] = value;
  });

  const updateRouteParams = useCallback(
    (key: keyof TIssueQueryFilters, value: string[]) => {
      const state = key === "state" ? value : issueFilters?.filters?.state ?? [];
      const priority = key === "priority" ? value : issueFilters?.filters?.priority ?? [];
      const labels = key === "labels" ? value : issueFilters?.filters?.labels ?? [];

      let params: any = { board: activeLayout || "list" };
      if (priority.length > 0) params = { ...params, priority: priority.join(",") };
      if (state.length > 0) params = { ...params, states: state.join(",") };
      if (labels.length > 0) params = { ...params, labels: labels.join(",") };
      params = new URLSearchParams(params).toString();

      router.push(`/${workspaceSlug}/${projectId}?${params}`);
    },
    [workspaceSlug, projectId, activeLayout, issueFilters, router]
  );

  const handleFilters = useCallback(
    (key: keyof TIssueQueryFilters, value: string | null) => {
      if (!projectId) return;

      let newValues = cloneDeep(issueFilters?.filters?.[key]) ?? [];

      if (value === null) newValues = [];
      else if (newValues.includes(value)) newValues.splice(newValues.indexOf(value), 1);

      updateIssueFilters(projectId, "filters", key, newValues);
      updateRouteParams(key, newValues);
    },
    [projectId, issueFilters, updateIssueFilters, updateRouteParams]
  );

  const handleRemoveAllFilters = () => {
    if (!projectId) return;

    initIssueFilters(projectId, {
      display_filters: { layout: activeLayout || "list" },
      filters: {
        state: [],
        priority: [],
        labels: [],
      },
    });

    router.push(`/${workspaceSlug}/${projectId}?${`board=${activeLayout || "list"}`}`);
  };

  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <div className="border-b border-custom-border-200 p-5 py-3">
      <AppliedFiltersList
        appliedFilters={appliedFilters || {}}
        handleRemoveFilter={handleFilters as any}
        handleRemoveAllFilters={handleRemoveAllFilters}
        labels={labels ?? []}
        states={states ?? []}
      />
    </div>
  );
});
