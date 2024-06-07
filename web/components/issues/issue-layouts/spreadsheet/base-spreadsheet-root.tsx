import { FC, useCallback } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { IIssueDisplayFilterOptions, TUnGroupedIssues } from "@plane/types";
// hooks
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { useIssues, useUser } from "@/hooks/store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// views
// types
// constants
import { IQuickActionProps, TRenderQuickActions } from "../list/list-view-types";
import { SpreadsheetView } from "./spreadsheet-view";

export type SpreadsheetStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW;
interface IBaseSpreadsheetRoot {
  viewId?: string;
  QuickActions: FC<IQuickActionProps>;
  storeType: SpreadsheetStoreType;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
  isCompletedCycle?: boolean;
}

export const BaseSpreadsheetRoot = observer((props: IBaseSpreadsheetRoot) => {
  const { viewId, QuickActions, storeType, canEditPropertiesBasedOnProject, isCompletedCycle = false } = props;
  // router
  const router = useRouter();
  const { projectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { issues, issuesFilter } = useIssues(storeType);
  const { updateIssue, removeIssue, removeIssueFromView, archiveIssue, restoreIssue, updateFilters } =
    useIssuesActions(storeType);
  // derived values
  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};
  // user role validation
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      const isEditingAllowedBasedOnProject =
        canEditPropertiesBasedOnProject && projectId ? canEditPropertiesBasedOnProject(projectId) : isEditingAllowed;

      return enableInlineEditing && isEditingAllowedBasedOnProject;
    },
    [canEditPropertiesBasedOnProject, enableInlineEditing, isEditingAllowed]
  );

  const issueIds = (issues.groupedIssueIds ?? []) as TUnGroupedIssues;

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!projectId) return;

      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, {
        ...updatedDisplayFilter,
      });
    },
    [projectId, updateFilters]
  );

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton, placement, portalElement }) => (
      <QuickActions
        parentRef={parentRef}
        customActionButton={customActionButton}
        issue={issue}
        handleDelete={async () => removeIssue(issue.project_id, issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleRemoveFromView={async () => removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
        portalElement={portalElement}
        readOnly={!isEditingAllowed || isCompletedCycle}
        placements={placement}
      />
    ),
    [isEditingAllowed, isCompletedCycle, removeIssue, updateIssue, removeIssueFromView, archiveIssue, restoreIssue]
  );

  return (
    <SpreadsheetView
      displayProperties={issuesFilter.issueFilters?.displayProperties ?? {}}
      displayFilters={issuesFilter.issueFilters?.displayFilters ?? {}}
      handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
      issueIds={issueIds}
      quickActions={renderQuickActions}
      updateIssue={updateIssue}
      canEditProperties={canEditProperties}
      quickAddCallback={issues.quickAddIssue}
      viewId={viewId}
      enableQuickCreateIssue={enableQuickAdd}
      disableIssueCreation={!enableIssueCreation || !isEditingAllowed || isCompletedCycle}
    />
  );
});
