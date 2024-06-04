import { FC, useCallback } from "react";
import { observer } from "mobx-react-lite";
// constants
import { EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useIssues, useUser } from "@/hooks/store";
import { useGroupIssuesDragNDrop } from "@/hooks/use-group-dragndrop";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// components
import { List } from "./default";
// types
import { IQuickActionProps, TRenderQuickActions } from "./list-view-types";

type ListStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.DRAFT
  | EIssuesStoreType.PROFILE
  | EIssuesStoreType.ARCHIVED;
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
  // store hooks
  const { issuesFilter, issues } = useIssues(storeType);
  const { updateIssue, removeIssue, removeIssueFromView, archiveIssue, restoreIssue } = useIssuesActions(storeType);
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { issueMap } = useIssues();
  // derived values
  const issueIds = issues?.groupedIssueIds || [];
  // auth
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      const isEditingAllowedBasedOnProject =
        canEditPropertiesBasedOnProject && projectId ? canEditPropertiesBasedOnProject(projectId) : isEditingAllowed;

      return !!enableInlineEditing && isEditingAllowedBasedOnProject;
    },
    [canEditPropertiesBasedOnProject, enableInlineEditing, isEditingAllowed]
  );

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;

  const group_by = displayFilters?.group_by || null;
  const orderBy = displayFilters?.order_by || undefined;
  const showEmptyGroup = displayFilters?.show_empty_groups ?? false;

  const handleOnDrop = useGroupIssuesDragNDrop(storeType, orderBy, group_by);

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef }) => (
      <QuickActions
        parentRef={parentRef}
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

  return (
    <div className="relative size-full bg-custom-background-90">
      <List
        issuesMap={issueMap}
        displayProperties={displayProperties}
        group_by={group_by}
        orderBy={orderBy}
        updateIssue={updateIssue}
        quickActions={renderQuickActions}
        issueIds={issueIds}
        showEmptyGroup={showEmptyGroup}
        viewId={viewId}
        quickAddCallback={issues?.quickAddIssue}
        enableIssueQuickAdd={!!enableQuickAdd}
        canEditProperties={canEditProperties}
        disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
        storeType={storeType}
        addIssuesToView={addIssuesToView}
        isCompletedCycle={isCompletedCycle}
        handleOnDrop={handleOnDrop}
      />
    </div>
  );
});
