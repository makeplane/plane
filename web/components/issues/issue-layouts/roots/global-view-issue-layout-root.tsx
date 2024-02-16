import React, { Fragment, useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues, useUser, useViewDetail } from "hooks/store";
import { useWorkspaceIssueProperties } from "hooks/use-workspace-issue-properties";
// components
import { IssuePeekOverview } from "components/issues";
import { SpreadsheetView } from "components/issues/issue-layouts";
import { AllIssueQuickActions } from "components/issues/issue-layouts/quick-action-dropdowns";
// ui
import { SpreadsheetLayoutLoader } from "components/ui";
// types
import { TIssue, IIssueDisplayFilterOptions, TViewTypes } from "@plane/types";
import { EIssueActions } from "../types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";
import { EViewPageType } from "constants/view";

type TGlobalViewIssueLayoutRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewPageType: EViewPageType;
};

export const GlobalViewIssueLayoutRoot: React.FC<TGlobalViewIssueLayoutRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType } = props;
  // hooks
  const {
    issues: { loader, groupedIssueIds, updateIssue, removeIssue },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);
  const {
    membership: { currentWorkspaceAllProjectsRole },
  } = useUser();
  const { issueIds } = groupedIssueIds;

  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);

  const issueActions = useMemo(
    () => ({
      [EIssueActions.UPDATE]: async (issue: TIssue) => {
        const projectId = issue.project_id;
        if (!workspaceSlug || !projectId || !viewId) return;

        await updateIssue(workspaceSlug.toString(), projectId, issue.id, issue, viewId.toString());
      },
      [EIssueActions.DELETE]: async (issue: TIssue) => {
        const projectId = issue.project_id;
        if (!workspaceSlug || !projectId || !viewId) return;

        await removeIssue(workspaceSlug.toString(), projectId, issue.id, viewId.toString());
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
      if (!workspaceSlug || !viewId) return;
      viewDetailStore?.setDisplayFilters({ order_by: updatedDisplayFilter?.order_by });
    },
    [viewDetailStore, workspaceSlug, viewId]
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

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return false;

      const currentProjectRole = currentWorkspaceAllProjectsRole && currentWorkspaceAllProjectsRole[projectId];
      return !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
    },
    [currentWorkspaceAllProjectsRole]
  );

  if (loader === "init-loader" || !issueIds) {
    return <SpreadsheetLayoutLoader />;
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {issueIds.length === 0 ? (
        <div>Empty state</div>
      ) : (
        <Fragment>
          <SpreadsheetView
            displayProperties={viewDetailStore?.appliedFilters?.display_properties ?? {}}
            displayFilters={viewDetailStore?.appliedFilters?.filters as IIssueDisplayFilterOptions} // Fix: Update the type of displayFilters prop
            handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
            issueIds={issueIds}
            quickActions={renderQuickActions}
            handleIssues={handleIssues}
            canEditProperties={canEditProperties}
            viewId={viewId}
          />
          {/* peek overview */}
          <IssuePeekOverview />
        </Fragment>
      )}
    </div>
  );
});
