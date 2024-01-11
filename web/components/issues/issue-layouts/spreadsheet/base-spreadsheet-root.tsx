import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useIssues, useUser } from "hooks/store";
// views
import { SpreadsheetView } from "./spreadsheet-view";
// types
import { TIssue, IIssueDisplayFilterOptions, TUnGroupedIssues } from "@plane/types";
import { EIssueActions } from "../types";
import { IQuickActionProps } from "../list/list-view-types";
// constants
import { EUserProjectRoles } from "constants/project";
import { ICycleIssuesFilter, ICycleIssues } from "store/issue/cycle";
import { IModuleIssuesFilter, IModuleIssues } from "store/issue/module";
import { IProjectIssuesFilter, IProjectIssues } from "store/issue/project";
import { IProjectViewIssuesFilter, IProjectViewIssues } from "store/issue/project-views";
import { EIssueFilterType } from "constants/issue";

interface IBaseSpreadsheetRoot {
  issueFiltersStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
  issueStore: IProjectIssues | ICycleIssues | IModuleIssues | IProjectViewIssues;
  viewId?: string;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (issue: TIssue) => void;
    [EIssueActions.UPDATE]?: (issue: TIssue) => void;
    [EIssueActions.REMOVE]?: (issue: TIssue) => void;
  };
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
}

export const BaseSpreadsheetRoot = observer((props: IBaseSpreadsheetRoot) => {
  const { issueFiltersStore, issueStore, viewId, QuickActions, issueActions, canEditPropertiesBasedOnProject } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };
  // store hooks
  const { issueMap } = useIssues();
  const {
    membership: { currentProjectRole },
  } = useUser();
  // derived values
  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issueStore?.viewFlags || {};
  // user role validation
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const canEditProperties = (projectId: string | undefined) => {
    const isEditingAllowedBasedOnProject =
      canEditPropertiesBasedOnProject && projectId ? canEditPropertiesBasedOnProject(projectId) : isEditingAllowed;

    return enableInlineEditing && isEditingAllowedBasedOnProject;
  };

  const issueIds = (issueStore.groupedIssueIds ?? []) as TUnGroupedIssues;

  const issues = issueIds?.filter((id) => id && issueMap?.[id]).map((id) => issueMap?.[id]);

  const handleIssues = useCallback(
    async (issue: TIssue, action: EIssueActions) => {
      if (issueActions[action]) {
        issueActions[action]!(issue);
      }
    },
    [issueActions]
  );

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;

      issueFiltersStore.updateFilters(
        workspaceSlug,
        projectId,
        EIssueFilterType.DISPLAY_FILTERS,
        {
          ...updatedDisplayFilter,
        },
        viewId
      );
    },
    [issueFiltersStore, projectId, workspaceSlug, viewId]
  );

  const renderQuickActions = useCallback(
    (issue: TIssue, customActionButton?: React.ReactElement, portalElement?: HTMLDivElement | null) => (
      <QuickActions
        customActionButton={customActionButton}
        issue={issue}
        handleDelete={async () => handleIssues(issue, EIssueActions.DELETE)}
        handleUpdate={
          issueActions[EIssueActions.UPDATE] ? async (data) => handleIssues(data, EIssueActions.UPDATE) : undefined
        }
        handleRemoveFromView={
          issueActions[EIssueActions.REMOVE] ? async () => handleIssues(issue, EIssueActions.REMOVE) : undefined
        }
        portalElement={portalElement}
      />
    ),
    [handleIssues]
  );

  return (
    <SpreadsheetView
      displayProperties={issueFiltersStore.issueFilters?.displayProperties ?? {}}
      displayFilters={issueFiltersStore.issueFilters?.displayFilters ?? {}}
      handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
      issues={issues}
      quickActions={renderQuickActions}
      handleIssues={handleIssues}
      canEditProperties={canEditProperties}
      quickAddCallback={issueStore.quickAddIssue}
      viewId={viewId}
      enableQuickCreateIssue={enableQuickAdd}
      disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
    />
  );
});
