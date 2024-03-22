import { FC, useCallback } from "react";
import { observer } from "mobx-react-lite";
// types
import { EIssueLayoutTypes, EIssuesStoreType } from "constants/issue";
import { EUserProjectRoles } from "constants/project";
import { useIssues, useUser } from "hooks/store";

import { TGroupedIssues, TIssue } from "@plane/types";
// components
import { List } from "./default";
import { IQuickActionProps } from "./list-view-types";
import { useIssuesActions } from "hooks/use-issues-actions";
import { IssueLayoutHOC } from "../issue-layout-HOC";
import useSWR from "swr";
import { ALL_ISSUES } from "store/issue/helpers/base-issues.store";
// constants
// hooks

type ListStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.ARCHIVED
  | EIssuesStoreType.DRAFT
  | EIssuesStoreType.PROFILE;
interface IBaseListRoot {
  QuickActions: FC<IQuickActionProps>;
  viewId?: string;
  storeType: ListStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
  isCompletedCycle?: boolean;
}
export const BaseListRoot = observer((props: IBaseListRoot) => {
  const {
    QuickActions,
    viewId,
    storeType,
    addIssuesToView,
    canEditPropertiesBasedOnProject,
    isCompletedCycle = false,
  } = props;

  const { issuesFilter, issues } = useIssues(storeType);
  const { fetchIssues, fetchNextIssues, updateIssue, removeIssue, removeIssueFromView, archiveIssue, restoreIssue } =
    useIssuesActions(storeType);
  // mobx store
  const {
    membership: { currentProjectRole },
  } = useUser();

  const { issueMap } = useIssues();

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;

  const group_by = displayFilters?.group_by || null;
  const showEmptyGroup = displayFilters?.show_empty_groups ?? false;

  useSWR(
    `ISSUE_LIST_LAYOUT_${storeType}_${group_by}`,
    () => fetchIssues("init-loader", { canGroup: true, perPageCount: 50 }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const groupedIssueIds = issues?.groupedIssueIds as TGroupedIssues | undefined;

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};
  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      const isEditingAllowedBasedOnProject =
        canEditPropertiesBasedOnProject && projectId ? canEditPropertiesBasedOnProject(projectId) : isEditingAllowed;

      return !!enableInlineEditing && isEditingAllowedBasedOnProject;
    },
    [canEditPropertiesBasedOnProject, enableInlineEditing, isEditingAllowed]
  );

  const renderQuickActions = useCallback(
    (issue: TIssue) => (
      <QuickActions
        issue={issue}
        handleDelete={async () => removeIssue(issue.project_id, issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleRemoveFromView={async () => removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
        readOnly={!isEditingAllowed || isCompletedCycle}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEditingAllowed, isCompletedCycle, removeIssue, updateIssue, removeIssueFromView, archiveIssue, restoreIssue]
  );

  const loadMoreIssues = useCallback(
    (groupId?: string) => {
      fetchNextIssues(groupId);
    },
    [fetchNextIssues]
  );

  const getPaginationData = useCallback(
    (groupId?: string) => {
      return issues?.getPaginationData(groupId, undefined);
    },
    [issues?.getPaginationData]
  );

  const getGroupIssueCount = useCallback(
    (groupId?: string) => {
      return issues?.getGroupIssueCount(groupId, undefined, false);
    },
    [issues?.getGroupIssueCount]
  );

  return (
    <IssueLayoutHOC storeType={storeType} layout={EIssueLayoutTypes.LIST}>
      <div className={`relative h-full w-full bg-custom-background-90`}>
        <List
          issuesMap={issueMap}
          displayProperties={displayProperties}
          group_by={group_by}
          updateIssue={updateIssue}
          quickActions={renderQuickActions}
          groupedIssueIds={groupedIssueIds ?? {}}
          loadMoreIssues={loadMoreIssues}
          showEmptyGroup={showEmptyGroup}
          viewId={viewId}
          getPaginationData={getPaginationData}
          getGroupIssueCount={getGroupIssueCount}
          quickAddCallback={issues?.quickAddIssue}
          enableIssueQuickAdd={!!enableQuickAdd}
          canEditProperties={canEditProperties}
          disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
          storeType={storeType}
          addIssuesToView={addIssuesToView}
          isCompletedCycle={isCompletedCycle}
        />
      </div>
    </IssueLayoutHOC>
  );
});
