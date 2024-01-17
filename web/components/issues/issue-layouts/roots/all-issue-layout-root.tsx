import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useGlobalView, useIssues, useUser } from "hooks/store";
// components
import { GlobalViewsAppliedFiltersRoot } from "components/issues";
import { SpreadsheetView } from "components/issues/issue-layouts";
import { AllIssueQuickActions } from "components/issues/issue-layouts/quick-action-dropdowns";
// ui
import { Spinner } from "@plane/ui";
// types
import { TIssue, IIssueDisplayFilterOptions, TStaticViewTypes, TUnGroupedIssues } from "@plane/types";
import { EIssueActions } from "../types";
import { EUserProjectRoles } from "constants/project";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

type Props = {
  type?: TStaticViewTypes | null;
};

export const AllIssueLayoutRoot: React.FC<Props> = observer((props) => {
  const { type = null } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query as { workspaceSlug: string; globalViewId: string };

  // store
  const {
    issuesFilter: { issueFilters, fetchFilters, updateFilters },
    issues: { loader, groupedIssueIds, fetchIssues, updateIssue, removeIssue },
    issueMap,
  } = useIssues(EIssuesStoreType.GLOBAL);

  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { fetchAllGlobalViews } = useGlobalView();
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
        await fetchAllGlobalViews(workspaceSlug);
        await fetchFilters(workspaceSlug, currentIssueView);
        await fetchIssues(workspaceSlug, currentIssueView, groupedIssueIds ? "mutation" : "init-loader");
      }
    }
  );

  const canEditProperties = (projectId: string | undefined) => {
    if (!projectId) return false;

    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  const issueIds = (groupedIssueIds ?? []) as TUnGroupedIssues;
  const issuesArray = issueIds?.filter((id: string) => id && issueMap?.[id]).map((id: string) => issueMap?.[id]);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        const projectId = issue.project_id;
        if (!workspaceSlug || !projectId) return;

        await updateIssue(workspaceSlug, projectId, issue.id, issue, currentIssueView);
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        const projectId = issue.project_id;
        if (!workspaceSlug || !projectId) return;

        await removeIssue(workspaceSlug, projectId, issue.id, currentIssueView);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateIssue, removeIssue, workspaceSlug]
  );

  const handleIssues = useCallback(
    async (issue: TIssue, action: EIssueActions) => {
      if (action === EIssueActions.UPDATE) await issueActions[action]!(issue);
      if (action === EIssueActions.DELETE) await issueActions[action]!(issue);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug) return;

      updateFilters(workspaceSlug, undefined, EIssueFilterType.DISPLAY_FILTERS, { ...updatedDisplayFilter });
    },
    [updateFilters, workspaceSlug]
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {globalViewId != currentIssueView && (loader === "init-loader" || !groupedIssueIds) ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <GlobalViewsAppliedFiltersRoot />

          {(groupedIssueIds ?? {}).length == 0 ? (
            <>{/* <GlobalViewEmptyState /> */}</>
          ) : (
            <div className="relative h-full w-full overflow-auto">
              <SpreadsheetView
                displayProperties={issueFilters?.displayProperties ?? {}}
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
                issues={issuesArray}
                quickActions={(issue) => (
                  <AllIssueQuickActions
                    issue={issue}
                    handleUpdate={async () => handleIssues({ ...issue }, EIssueActions.UPDATE)}
                    handleDelete={async () => handleIssues(issue, EIssueActions.DELETE)}
                  />
                )}
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
