import { FC, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
// types
import { GroupByColumnTypes, TGroupedIssues, TIssue } from "@plane/types";
// constants
import { EIssueLayoutTypes, EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { useIssues, useUser } from "@/hooks/store";
// hooks
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// components
import { IssueLayoutHOC } from "../issue-layout-HOC";
import { List } from "./default";
import { IQuickActionProps } from "./list-view-types";

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
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
  viewId?: string | undefined;
  isCompletedCycle?: boolean;
}
export const BaseListRoot = observer((props: IBaseListRoot) => {
  const { QuickActions, addIssuesToView, canEditPropertiesBasedOnProject, isCompletedCycle = false, viewId } = props;

  const storeType = useIssueStoreType() as ListStoreType;
  const { issuesFilter, issues } = useIssues(storeType);
  const {
    fetchIssues,
    fetchNextIssues,
    quickAddIssue,
    updateIssue,
    removeIssue,
    removeIssueFromView,
    archiveIssue,
    restoreIssue,
  } = useIssuesActions(storeType);
  // mobx store
  const {
    membership: { currentProjectRole },
  } = useUser();

  const { issueMap } = useIssues();

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;

  const group_by = (displayFilters?.group_by || null) as GroupByColumnTypes | null;
  const showEmptyGroup = displayFilters?.show_empty_groups ?? false;

  useEffect(() => {
    fetchIssues("init-loader", { canGroup: true, perPageCount: group_by ? 50 : 100 }, viewId);
  }, [fetchIssues, storeType, group_by, viewId]);

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

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.LIST}>
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
          quickAddCallback={quickAddIssue}
          enableIssueQuickAdd={!!enableQuickAdd}
          canEditProperties={canEditProperties}
          disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
          addIssuesToView={addIssuesToView}
          isCompletedCycle={isCompletedCycle}
        />
      </div>
    </IssueLayoutHOC>
  );
});
