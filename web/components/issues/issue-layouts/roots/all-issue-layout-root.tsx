import React, { useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useGlobalView, useLabel, useUser } from "hooks/store";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { GlobalViewsAppliedFiltersRoot } from "components/issues";
import { SpreadsheetView } from "components/issues/issue-layouts";
import { AllIssueQuickActions } from "components/issues/issue-layouts/quick-action-dropdowns";
// ui
import { Spinner } from "@plane/ui";
// types
import { IIssue, IIssueDisplayFilterOptions, TStaticViewTypes } from "types";
import { IIssueUnGroupedStructure } from "store_legacy/issue";
import { EIssueActions } from "../types";

import { EIssueFilterType, TUnGroupedIssues } from "store_legacy/issues/types";
import { EUserProjectRoles } from "constants/project";

type Props = {
  type?: TStaticViewTypes | null;
};

export const AllIssueLayoutRoot: React.FC<Props> = observer((props) => {
  const { type = null } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query as { workspaceSlug: string; globalViewId: string };
  // store hooks
  const {
    workspaceGlobalIssues: { loader, getIssues, getIssuesIds, fetchIssues, updateIssue, removeIssue },
    workspaceGlobalIssuesFilter: { currentView, issueFilters, fetchFilters, updateFilters, setCurrentView },
  } = useMobxStore();
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { fetchAllGlobalViews } = useGlobalView();
  const {
    workspace: { workspaceLabels },
  } = useLabel();
  // derived values
  const currentIssueView = type ?? globalViewId;

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

  const canEditProperties = (projectId: string | undefined) => {
    if (!projectId) return false;

    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  const issuesResponse = getIssues;
  const issueIds = (getIssuesIds ?? []) as TUnGroupedIssues;
  const issues = issueIds?.filter((id) => id && issuesResponse?.[id]).map((id) => issuesResponse?.[id]);

  const issueActions = {
    [EIssueActions.UPDATE]: async (issue: IIssue) => {
      const projectId = issue.project;
      if (!workspaceSlug || !projectId) return;

      await updateIssue(workspaceSlug, projectId, issue.id, issue, currentIssueView);
    },
    [EIssueActions.DELETE]: async (issue: IIssue) => {
      const projectId = issue.project;
      if (!workspaceSlug || !projectId) return;

      await removeIssue(workspaceSlug, projectId, issue.id, currentIssueView);
    },
  };

  const handleIssues = useCallback(
    async (issue: IIssue, action: EIssueActions) => {
      if (action === EIssueActions.UPDATE) await issueActions[action]!(issue);
      if (action === EIssueActions.DELETE) await issueActions[action]!(issue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug) return;

      updateFilters(workspaceSlug, EIssueFilterType.DISPLAY_FILTERS, { ...updatedDisplayFilter });
    },
    [updateFilters, workspaceSlug]
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {currentView != currentIssueView && (loader === "init-loader" || !getIssues) ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <GlobalViewsAppliedFiltersRoot />

          {Object.keys(getIssues ?? {}).length == 0 ? (
            <>{/* <GlobalViewEmptyState /> */}</>
          ) : (
            <div className="relative h-full w-full overflow-auto">
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
                labels={workspaceLabels || undefined}
                handleIssues={handleIssues}
                canEditProperties={canEditProperties}
                viewId={currentIssueView}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
});
