import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useLabel, useProjectState } from "hooks/store";
import { useMobxStore } from "lib/mobx/store-provider";
import {
  ICycleIssuesFilterStore,
  ICycleIssuesStore,
  IModuleIssuesFilterStore,
  IModuleIssuesStore,
  IProjectIssuesFilterStore,
  IProjectIssuesStore,
  IViewIssuesFilterStore,
  IViewIssuesStore,
} from "store_legacy/issues";
import { IIssueUnGroupedStructure } from "store_legacy/issue";
// views
import { SpreadsheetView } from "./spreadsheet-view";
// types
import { IIssue, IIssueDisplayFilterOptions } from "types";
import { EIssueFilterType, TUnGroupedIssues } from "store_legacy/issues/types";
import { EIssueActions } from "../types";
import { IQuickActionProps } from "../list/list-view-types";
// constants
import { EUserProjectRoles } from "constants/project";

interface IBaseSpreadsheetRoot {
  issueFiltersStore:
    | IViewIssuesFilterStore
    | ICycleIssuesFilterStore
    | IModuleIssuesFilterStore
    | IProjectIssuesFilterStore;
  issueStore: IProjectIssuesStore | IModuleIssuesStore | ICycleIssuesStore | IViewIssuesStore;
  viewId?: string;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (issue: IIssue) => void;
    [EIssueActions.UPDATE]?: (issue: IIssue) => void;
    [EIssueActions.REMOVE]?: (issue: IIssue) => void;
  };
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
}

export const BaseSpreadsheetRoot = observer((props: IBaseSpreadsheetRoot) => {
  const { issueFiltersStore, issueStore, viewId, QuickActions, issueActions, canEditPropertiesBasedOnProject } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };
  // store hooks
  const {
    projectMember: { projectMembers },
    user: userStore,
  } = useMobxStore();
  const {
    project: { projectLabels },
  } = useLabel();
  const { projectStates } = useProjectState();
  // derived values
  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issueStore?.viewFlags || {};
  const { currentProjectRole } = userStore;
  // user role validation
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const canEditProperties = (projectId: string | undefined) => {
    const isEditingAllowedBasedOnProject =
      canEditPropertiesBasedOnProject && projectId ? canEditPropertiesBasedOnProject(projectId) : isEditingAllowed;

    return enableInlineEditing && isEditingAllowedBasedOnProject;
  };

  const issuesResponse = issueStore.getIssues;
  const issueIds = (issueStore.getIssuesIds ?? []) as TUnGroupedIssues;

  const issues = issueIds?.filter((id) => id && issuesResponse?.[id]).map((id) => issuesResponse?.[id]);

  const handleIssues = useCallback(
    async (issue: IIssue, action: EIssueActions) => {
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

  return (
    <SpreadsheetView
      displayProperties={issueFiltersStore.issueFilters?.displayProperties ?? {}}
      displayFilters={issueFiltersStore.issueFilters?.displayFilters ?? {}}
      handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
      issues={issues as IIssueUnGroupedStructure}
      quickActions={(issue, customActionButton) => (
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
        />
      )}
      members={projectMembers?.map((m) => m.member)}
      labels={projectLabels ?? []}
      states={projectStates}
      handleIssues={handleIssues}
      canEditProperties={canEditProperties}
      quickAddCallback={issueStore.quickAddIssue}
      viewId={viewId}
      enableQuickCreateIssue={enableQuickAdd}
      disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
    />
  );
});
