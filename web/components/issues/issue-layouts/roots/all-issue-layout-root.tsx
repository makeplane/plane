import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// hooks
import { useGlobalView, useIssues, useUser } from "hooks/store";
import { useWorskspaceIssueProperties } from "hooks/use-worskspace-issue-properties";
// components
import { GlobalViewsAppliedFiltersRoot, IssuePeekOverview } from "components/issues";
import { SpreadsheetView } from "components/issues/issue-layouts";
import { AllIssueQuickActions } from "components/issues/issue-layouts/quick-action-dropdowns";
// ui
import { Spinner } from "@plane/ui";
// types
import { TIssue, IIssueDisplayFilterOptions } from "@plane/types";
import { EIssueActions } from "../types";
import { EUserProjectRoles } from "constants/project";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";

export const AllIssueLayoutRoot: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, globalViewId } = router.query;
  //swr hook for fetching issue properties
  useWorskspaceIssueProperties(workspaceSlug);
  // store
  const {
    issuesFilter: { filters, fetchFilters, updateFilters },
    issues: { loader, groupedIssueIds, fetchIssues, updateIssue, removeIssue },
  } = useIssues(EIssuesStoreType.GLOBAL);

  const { dataViewId, issueIds } = groupedIssueIds;
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { fetchAllGlobalViews } = useGlobalView();
  // derived values

  useSWR(workspaceSlug ? `WORKSPACE_GLOBAL_VIEWS${workspaceSlug}` : null, async () => {
    if (workspaceSlug) {
      await fetchAllGlobalViews(workspaceSlug.toString());
    }
  });

  useSWR(
    workspaceSlug && globalViewId ? `WORKSPACE_GLOBAL_VIEW_ISSUES_${workspaceSlug}_${globalViewId}` : null,
    async () => {
      if (workspaceSlug && globalViewId) {
        await fetchAllGlobalViews(workspaceSlug.toString());
        await fetchFilters(workspaceSlug.toString(), globalViewId.toString());
        await fetchIssues(workspaceSlug.toString(), globalViewId.toString(), issueIds ? "mutation" : "init-loader");
      }
    }
  );

  const canEditProperties = (projectId: string | undefined) => {
    if (!projectId) return false;

    const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];

    return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  };

  const issueFilters = globalViewId ? filters?.[globalViewId.toString()] : undefined;

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        const projectId = issue.project_id;
        if (!workspaceSlug || !projectId || !globalViewId) return;

        await updateIssue(workspaceSlug.toString(), projectId, issue.id, issue, globalViewId.toString());
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        const projectId = issue.project_id;
        if (!workspaceSlug || !projectId || !globalViewId) return;

        await removeIssue(workspaceSlug.toString(), projectId, issue.id, globalViewId.toString());
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

      updateFilters(workspaceSlug.toString(), undefined, EIssueFilterType.DISPLAY_FILTERS, { ...updatedDisplayFilter });
    },
    [updateFilters, workspaceSlug]
  );

  const renderQuickActions = useCallback(
    (issue: TIssue, customActionButton?: React.ReactElement, portalElement?: HTMLDivElement | null) => (
      <AllIssueQuickActions
        customActionButton={customActionButton}
        issue={issue}
        handleUpdate={async () => handleIssues({ ...issue }, EIssueActions.UPDATE)}
        handleDelete={async () => handleIssues(issue, EIssueActions.DELETE)}
        portalElement={portalElement}
      />
    ),
    [handleIssues]
  );

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {!globalViewId || globalViewId !== dataViewId || loader === "init-loader" || !issueIds ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <GlobalViewsAppliedFiltersRoot globalViewId={globalViewId} />

          {(issueIds ?? {}).length == 0 ? (
            <>{/* <GlobalViewEmptyState /> */}</>
          ) : (
            <div className="relative h-full w-full overflow-auto">
              <SpreadsheetView
                displayProperties={issueFilters?.displayProperties ?? {}}
                displayFilters={issueFilters?.displayFilters ?? {}}
                handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
                issueIds={issueIds}
                quickActions={renderQuickActions}
                handleIssues={handleIssues}
                canEditProperties={canEditProperties}
                viewId={globalViewId}
              />
            </div>
          )}
        </>
      )}

      {/* peek overview */}
      <IssuePeekOverview />
    </div>
  );
});
