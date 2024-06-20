"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { DeleteIssueModal } from "@/components/issues";
//constants
import { ISSUE_DELETED } from "@/constants/event-tracker";
import { EIssueFilterType, EIssueLayoutTypes, EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
//hooks
import { useEventTracker, useIssueDetail, useIssues, useKanbanView, useUser } from "@/hooks/store";
import { useGroupIssuesDragNDrop } from "@/hooks/use-group-dragndrop";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// store
// ui
// types
import { IssueLayoutHOC } from "../issue-layout-HOC";
import { IQuickActionProps, TRenderQuickActions } from "../list/list-view-types";
//components
import { getSourceFromDropPayload } from "../utils";
import { KanBan } from "./default";
import { KanBanSwimLanes } from "./swimlanes";

export type KanbanStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.DRAFT
  | EIssuesStoreType.PROFILE;
export interface IBaseKanBanLayout {
  QuickActions: FC<IQuickActionProps>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
  isCompletedCycle?: boolean;
  viewId?: string | undefined;
}

export const BaseKanBanRoot: React.FC<IBaseKanBanLayout> = observer((props: IBaseKanBanLayout) => {
  const { QuickActions, addIssuesToView, canEditPropertiesBasedOnProject, isCompletedCycle = false, viewId } = props;
  // router
  const { workspaceSlug, projectId } = useParams();
  const pathname = usePathname();
  // store hooks
  const storeType = useIssueStoreType() as KanbanStoreType;
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { captureIssueEvent } = useEventTracker();
  const { issueMap, issuesFilter, issues } = useIssues(storeType);
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const {
    fetchIssues,
    fetchNextIssues,
    quickAddIssue,
    updateIssue,
    removeIssue,
    removeIssueFromView,
    archiveIssue,
    restoreIssue,
    updateFilters,
  } = useIssuesActions(storeType);

  const deleteAreaRef = useRef<HTMLDivElement | null>(null);
  const [isDragOverDelete, setIsDragOverDelete] = useState(false);

  const { isDragging } = useKanbanView();

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;

  const sub_group_by = displayFilters?.sub_group_by;
  const group_by = displayFilters?.group_by;

  const orderBy = displayFilters?.order_by;

  useEffect(() => {
    fetchIssues("init-loader", { canGroup: true, perPageCount: sub_group_by ? 10 : 30 }, viewId);
  }, [fetchIssues, storeType, group_by, sub_group_by, viewId]);

  const fetchMoreIssues = useCallback(
    (groupId?: string, subgroupId?: string) => {
      if (issues?.getIssueLoader(groupId, subgroupId) !== "pagination") {
        fetchNextIssues(groupId, subgroupId);
      }
    },
    [fetchNextIssues]
  );

  const debouncedFetchMoreIssues = debounce(
    (groupId?: string, subgroupId?: string) => fetchMoreIssues(groupId, subgroupId),
    300,
    { leading: true, trailing: false }
  );

  const groupedIssueIds = issues?.groupedIssueIds;

  const userDisplayFilters = displayFilters || null;

  const KanBanView = sub_group_by ? KanBanSwimLanes : KanBan;

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};

  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  // states
  const [draggedIssueId, setDraggedIssueId] = useState<string | undefined>(undefined);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const handleOnDrop = useGroupIssuesDragNDrop(storeType, orderBy, group_by, sub_group_by);

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      const isEditingAllowedBasedOnProject =
        canEditPropertiesBasedOnProject && projectId ? canEditPropertiesBasedOnProject(projectId) : isEditingAllowed;

      return enableInlineEditing && isEditingAllowedBasedOnProject;
    },
    [canEditPropertiesBasedOnProject, enableInlineEditing, isEditingAllowed]
  );

  // Enable Auto Scroll for Main Kanban
  useEffect(() => {
    const element = scrollableContainerRef.current;

    if (!element) return;

    return combine(
      autoScrollForElements({
        element,
      })
    );
  }, [scrollableContainerRef?.current]);

  // Make the Issue Delete Box a Drop Target
  useEffect(() => {
    const element = deleteAreaRef.current;

    if (!element) return;

    return combine(
      dropTargetForElements({
        element,
        getData: () => ({ columnId: "issue-trash-box", groupId: "issue-trash-box", type: "DELETE" }),
        onDragEnter: () => {
          setIsDragOverDelete(true);
        },
        onDragLeave: () => {
          setIsDragOverDelete(false);
        },
        onDrop: (payload) => {
          setIsDragOverDelete(false);
          const source = getSourceFromDropPayload(payload);

          if (!source) return;

          setDraggedIssueId(source.id);
          setDeleteIssueModal(true);
        },
      })
    );
  }, [deleteAreaRef?.current, setIsDragOverDelete, setDraggedIssueId, setDeleteIssueModal]);

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton }) => (
      <QuickActions
        parentRef={parentRef}
        customActionButton={customActionButton}
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

  const handleDeleteIssue = async () => {
    const draggedIssue = getIssueById(draggedIssueId ?? "");

    if (!draggedIssueId || !draggedIssue) return;

    await removeIssue(draggedIssue.project_id, draggedIssueId).finally(() => {
      setDeleteIssueModal(false);
      setDraggedIssueId(undefined);
      captureIssueEvent({
        eventName: ISSUE_DELETED,
        payload: { id: draggedIssueId, state: "FAILED", element: "Kanban layout drag & drop" },
        path: pathname,
      });
    });
  };

  const handleKanbanFilters = (toggle: "group_by" | "sub_group_by", value: string) => {
    if (workspaceSlug) {
      let kanbanFilters = issuesFilter?.issueFilters?.kanbanFilters?.[toggle] || [];
      if (kanbanFilters.includes(value)) {
        kanbanFilters = kanbanFilters.filter((_value) => _value != value);
      } else {
        kanbanFilters.push(value);
      }
      updateFilters(projectId?.toString() ?? "", EIssueFilterType.KANBAN_FILTERS, {
        [toggle]: kanbanFilters,
      });
    }
  };

  const kanbanFilters = issuesFilter?.issueFilters?.kanbanFilters || { group_by: [], sub_group_by: [] };

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.KANBAN}>
      <DeleteIssueModal
        dataId={draggedIssueId}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDeleteIssue}
      />

      <div
        className={`horizontal-scrollbar scrollbar-lg relative flex h-full w-full bg-custom-background-90 ${sub_group_by ? "vertical-scrollbar overflow-y-auto" : "overflow-x-auto overflow-y-hidden"}`}
        ref={scrollableContainerRef}
      >
        <div className="relative h-full w-max min-w-full bg-custom-background-90">
          {/* drag and delete component */}
          <div
            className={`fixed left-1/2 -translate-x-1/2 ${
              isDragging ? "z-40" : ""
            } top-3 mx-3 flex w-72 items-center justify-center`}
            ref={deleteAreaRef}
          >
            <div
              className={`${
                isDragging ? `opacity-100` : `opacity-0`
              } flex w-full items-center justify-center rounded border-2 border-red-500/20 bg-custom-background-100 px-3 py-5 text-xs font-medium italic text-red-500 ${
                isDragOverDelete ? "bg-red-500 opacity-70 blur-2xl" : ""
              } transition duration-300`}
            >
              Drop here to delete the issue.
            </div>
          </div>

          <div className="h-full w-max">
            <KanBanView
              issuesMap={issueMap}
              groupedIssueIds={groupedIssueIds ?? {}}
              getGroupIssueCount={issues.getGroupIssueCount}
              displayProperties={displayProperties}
              sub_group_by={sub_group_by}
              group_by={group_by}
              orderBy={orderBy}
              updateIssue={updateIssue}
              quickActions={renderQuickActions}
              handleKanbanFilters={handleKanbanFilters}
              kanbanFilters={kanbanFilters}
              enableQuickIssueCreate={enableQuickAdd}
              showEmptyGroup={userDisplayFilters?.show_empty_groups ?? true}
              quickAddCallback={quickAddIssue}
              disableIssueCreation={!enableIssueCreation || !isEditingAllowed || isCompletedCycle}
              canEditProperties={canEditProperties}
              addIssuesToView={addIssuesToView}
              scrollableContainerRef={scrollableContainerRef}
              handleOnDrop={handleOnDrop}
              loadMoreIssues={debouncedFetchMoreIssues}
            />
          </div>
        </div>
      </div>
    </IssueLayoutHOC>
  );
});
