import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { GlobalViewEmptyState, GlobalViewsAppliedFiltersRoot } from "components/issues";
import { SpreadsheetView } from "components/issues/issue-layouts";
import { AllIssueQuickActions } from "components/issues/issue-layouts/quick-action-dropdowns";
// ui
import { Spinner } from "@plane/ui";
// types
import { IIssue, IIssueDisplayFilterOptions, TStaticViewTypes } from "types";
import { IIssueUnGroupedStructure } from "store/issue";
import { EIssueActions } from "../types";

import { EFilterType, TUnGroupedIssues } from "store/issues/types";

type Props = {
  type?: TStaticViewTypes | null;
};

export const AllIssueLayoutRoot: React.FC<Props> = observer((props) => {
  const { type = null } = props;

  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query as { workspaceSlug: string; globalViewId: string };

  const currentIssueView = type ?? globalViewId;

  const {
    workspaceMember: { workspaceMembers },
    workspace: { workspaceLabels },
    globalViews: { fetchAllGlobalViews },
    workspaceGlobalIssues: { loader, getIssues, getIssuesIds, fetchIssues, updateIssue, removeIssue },
    workspaceGlobalIssuesFilter: { currentView, issueFilters, fetchFilters, updateFilters, setCurrentView },
  } = useMobxStore();

  useSWR(workspaceSlug ? `WORKSPACE_GLOBAL_VIEWS${workspaceSlug}` : null, async () => {
    if (workspaceSlug) {
      await fetchAllGlobalViews(workspaceSlug);
    }
  });

  useSWR(
    workspaceSlug && currentIssueView ? `WORKSPACE_GLOBAL_VIEW_ISSUES_${workspaceSlug}_${currentIssueView}` : null,
    async () => {
      if (workspaceSlug && currentIssueView) {
        setCurrentView(currentIssueView);
        await fetchAllGlobalViews(workspaceSlug);
        await fetchFilters(workspaceSlug, currentIssueView);
        await fetchIssues(workspaceSlug, currentIssueView, getIssues ? "mutation" : "init-loader");
      }
    }
  );

  const isEditingAllowed = false;

  const issuesResponse = getIssues;
  const issueIds = (getIssuesIds ?? []) as TUnGroupedIssues;
  const issues = issueIds?.filter((id) => id && issuesResponse?.[id]).map((id) => issuesResponse?.[id]);

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await updateIssue(workspaceSlug, issue.project, issue.id, issue);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      if (!workspaceSlug) return;

      await removeIssue(workspaceSlug, issue.project, issue.id);
    },
  };

  const handleIssues = useCallback(
    async (issue: IIssue, action: EIssueActions) => {
      if (issueActions && action && issue) {
        if (action === EIssueActions.UPDATE) await issueActions[action]!(issue);
        if (action === EIssueActions.DELETE) await issueActions[action]!(issue);
      }
    },
    [getIssues]
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug) return;

      updateFilters(workspaceSlug, EFilterType.DISPLAY_FILTERS, { ...updatedDisplayFilter });
    },
    [updateFilters, workspaceSlug]
  );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {currentView != currentIssueView && loader === "init-loader" ? (
        <div className="w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          <GlobalViewsAppliedFiltersRoot />

          {Object.keys(getIssues ?? {}).length == 0 && !loader ? (
            <>{/* <GlobalViewEmptyState /> */}</>
          ) : (
            <div className="w-full h-full relative overflow-auto">
              <SpreadsheetView
                displayProperties={issueFilters?.displayProperties ?? {}}
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
                issues={issues as IIssueUnGroupedStructure}
                quickActions={(issue) => (
                  <AllIssueQuickActions
                    issue={issue}
                    handleUpdate={async () => handleIssues({ ...issue }, EIssueActions.UPDATE)}
                    handleDelete={async () => handleIssues(issue, EIssueActions.DELETE)}
                  />
                )}
                members={workspaceMembers?.map((m) => m.member)}
                labels={workspaceLabels || undefined}
                handleIssues={handleIssues}
                disableUserActions={isEditingAllowed}
                viewId={currentIssueView}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
});
