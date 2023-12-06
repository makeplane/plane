import { IIssueUnGroupedStructure } from "store/issue";
import { SpreadsheetView } from "./spreadsheet-view";
import { FC, useCallback } from "react";
import { IIssue, IIssueDisplayFilterOptions } from "types";
import { useRouter } from "next/router";
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
} from "store/issues";
import { observer } from "mobx-react-lite";
import { EFilterType, TUnGroupedIssues } from "store/issues/types";
import { EIssueActions } from "../types";
import { IQuickActionProps } from "../list/list-view-types";
import { EUserWorkspaceRoles } from "constants/workspace";

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
}

export const BaseSpreadsheetRoot = observer((props: IBaseSpreadsheetRoot) => {
  const { issueFiltersStore, issueStore, viewId, QuickActions, issueActions } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query as { workspaceSlug: string; projectId: string };

  const {
    projectMember: { projectMembers },
    projectState: projectStateStore,
    projectLabel: { projectLabels },
    user: userStore,
  } = useMobxStore();

  const { currentProjectRole } = userStore;
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

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
        EFilterType.DISPLAY_FILTERS,
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
      labels={projectLabels || undefined}
      states={projectId ? projectStateStore.states?.[projectId.toString()] : undefined}
      handleIssues={handleIssues}
      disableUserActions={!isEditingAllowed}
      quickAddCallback={issueStore.quickAddIssue}
      viewId={viewId}
      enableQuickCreateIssue
    />
  );
});
