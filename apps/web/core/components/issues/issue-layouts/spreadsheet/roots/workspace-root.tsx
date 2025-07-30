import React, { useCallback } from "react";
import { observer } from "mobx-react";
// plane constants
import { ALL_ISSUES, EIssueFilterType, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { IIssueDisplayFilterOptions, EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// components
import { SpreadsheetView } from "@/components/issues/issue-layouts";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { SpreadsheetLayoutLoader } from "@/components/ui";
// hooks
import { useIssues, useUserPermissions } from "@/hooks/store";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// store
import { IssuePeekOverview } from "../../../peek-overview";
import { IssueLayoutHOC } from "../../issue-layout-HOC";
import { TRenderQuickActions } from "../../list/list-view-types";

type Props = {
  isDefaultView: boolean;
  isLoading?: boolean;
  toggleLoading: (value: boolean) => void;
  workspaceSlug: string;
  globalViewId: string;
  routeFilters: {
    [key: string]: string;
  };
  fetchNextPages: () => void;
  globalViewsLoading: boolean;
  issuesLoading: boolean;
};

export const WorkspaceSpreadsheetRoot: React.FC<Props> = observer((props: Props) => {
  const { isLoading = false, workspaceSlug, globalViewId, fetchNextPages, issuesLoading } = props;

  // Custom hooks
  useWorkspaceIssueProperties(workspaceSlug);

  // Store hooks
  const {
    issuesFilter: { filters, updateFilters },
    issues: { getIssueLoader, getPaginationData, groupedIssueIds },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { updateIssue, removeIssue, archiveIssue } = useIssuesActions(EIssuesStoreType.GLOBAL);
  const { allowPermissions } = useUserPermissions();

  // Derived values
  const issueFilters = globalViewId ? filters?.[globalViewId.toString()] : undefined;

  // Permission checker
  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return false;
      return allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug.toString(),
        projectId
      );
    },
    [allowPermissions, workspaceSlug]
  );

  // Display filters handler
  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !globalViewId) return;

      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        { ...updatedDisplayFilter },
        globalViewId.toString()
      );
    },
    [updateFilters, workspaceSlug, globalViewId]
  );

  // Quick actions renderer
  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton, placement, portalElement }) => (
      <AllIssueQuickActions
        parentRef={parentRef}
        customActionButton={customActionButton}
        issue={issue}
        handleDelete={async () => removeIssue(issue.project_id, issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        portalElement={portalElement}
        readOnly={!canEditProperties(issue.project_id ?? undefined)}
        placements={placement}
      />
    ),
    [canEditProperties, removeIssue, updateIssue, archiveIssue]
  );

  // Loading state
  if ((isLoading && issuesLoading && getIssueLoader() === "init-loader") || !globalViewId || !groupedIssueIds) {
    return <SpreadsheetLayoutLoader />;
  }

  // Computed values
  const issueIds = groupedIssueIds[ALL_ISSUES];
  const nextPageResults = getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  // Render spreadsheet
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.GLOBAL}>
      <IssueLayoutHOC layout={EIssueLayoutTypes.SPREADSHEET}>
        <SpreadsheetView
          displayProperties={issueFilters?.displayProperties ?? {}}
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
          issueIds={Array.isArray(issueIds) ? issueIds : []}
          quickActions={renderQuickActions}
          updateIssue={updateIssue}
          canEditProperties={canEditProperties}
          canLoadMoreIssues={!!nextPageResults}
          loadMoreIssues={fetchNextPages}
          isWorkspaceLevel
        />
        {/* peek overview */}
        <IssuePeekOverview />
      </IssueLayoutHOC>
    </IssuesStoreContext.Provider>
  );
});
