import { FC, useCallback, useRef, useState } from "react";
import { DragDropContext, DragStart, DraggableLocation, DropResult, Droppable } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { TIssue } from "@plane/types";
// hooks
import { Spinner, TOAST_TYPE, setToast } from "@plane/ui";
import { DeleteIssueModal } from "@/components/issues";
import { ISSUE_DELETED } from "@/constants/event-tracker";
import { EIssueFilterType, EIssuesStoreType } from "@/constants/issue";
import { EUserProjectRoles } from "@/constants/project";
import { useEventTracker, useIssues, useUser } from "@/hooks/store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// ui
// types
import { IQuickActionProps } from "../list/list-view-types";
//components
import { KanBan } from "./default";
import { KanBanSwimLanes } from "./swimlanes";
import { handleDragDrop } from "./utils";

export type KanbanStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.DRAFT
  | EIssuesStoreType.PROFILE;
export interface IBaseKanBanLayout {
  QuickActions: FC<IQuickActionProps>;
  showLoader?: boolean;
  viewId?: string;
  storeType: KanbanStoreType;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
  isCompletedCycle?: boolean;
}

type KanbanDragState = {
  draggedIssueId?: string | null;
  source?: DraggableLocation | null;
  destination?: DraggableLocation | null;
};

export const BaseKanBanRoot: React.FC<IBaseKanBanLayout> = observer((props: IBaseKanBanLayout) => {
  const {
    QuickActions,
    showLoader,
    viewId,
    storeType,
    addIssuesToView,
    canEditPropertiesBasedOnProject,
    isCompletedCycle = false,
  } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { captureIssueEvent } = useEventTracker();
  const { issueMap, issuesFilter, issues } = useIssues(storeType);
  const { updateIssue, removeIssue, removeIssueFromView, archiveIssue, restoreIssue, updateFilters } =
    useIssuesActions(storeType);

  const issueIds = issues?.groupedIssueIds || [];

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;

  const sub_group_by: string | null = displayFilters?.sub_group_by || null;
  const group_by: string | null = displayFilters?.group_by || null;

  const userDisplayFilters = displayFilters || null;

  const KanBanView = sub_group_by ? KanBanSwimLanes : KanBan;

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};

  const scrollableContainerRef = useRef<HTMLDivElement | null>(null);

  // states
  const [isDragStarted, setIsDragStarted] = useState<boolean>(false);
  const [dragState, setDragState] = useState<KanbanDragState>({});
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      const isEditingAllowedBasedOnProject =
        canEditPropertiesBasedOnProject && projectId ? canEditPropertiesBasedOnProject(projectId) : isEditingAllowed;

      return enableInlineEditing && isEditingAllowedBasedOnProject;
    },
    [canEditPropertiesBasedOnProject, enableInlineEditing, isEditingAllowed]
  );

  const onDragStart = (dragStart: DragStart) => {
    setDragState({
      draggedIssueId: dragStart.draggableId.split("__")[0],
    });
    setIsDragStarted(true);
  };

  const onDragEnd = async (result: DropResult) => {
    setIsDragStarted(false);

    if (!result) return;

    if (
      result.destination &&
      result.source &&
      result.source.droppableId &&
      result.destination.droppableId &&
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    if (handleDragDrop) {
      if (result.destination?.droppableId && result.destination?.droppableId.split("__")[0] === "issue-trash-box") {
        setDragState({
          ...dragState,
          source: result.source,
          destination: result.destination,
        });
        setDeleteIssueModal(true);
      } else {
        await handleDragDrop(
          result.source,
          result.destination,
          workspaceSlug?.toString(),
          projectId?.toString(),
          sub_group_by,
          group_by,
          issueMap,
          issueIds,
          updateIssue,
          removeIssue
        ).catch((err) => {
          setToast({
            title: "Error",
            type: TOAST_TYPE.ERROR,
            message: err?.detail ?? "Failed to perform this action",
          });
        });
      }
    }
  };

  const renderQuickActions = useCallback(
    (issue: TIssue, customActionButton?: React.ReactElement) => (
      <QuickActions
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
    if (!handleDragDrop || !dragState.draggedIssueId) return;
    await handleDragDrop(
      dragState.source,
      dragState.destination,
      workspaceSlug?.toString(),
      projectId?.toString(),
      sub_group_by,
      group_by,
      issueMap,
      issueIds,
      updateIssue,
      removeIssue
    ).finally(() => {
      const draggedIssue = issueMap[dragState.draggedIssueId!];
      removeIssue(draggedIssue.project_id, draggedIssue.id);
      setDeleteIssueModal(false);
      setDragState({});
      captureIssueEvent({
        eventName: ISSUE_DELETED,
        payload: { id: dragState.draggedIssueId!, state: "FAILED", element: "Kanban layout drag & drop" },
        path: router.asPath,
      });
    });
  };

  const handleKanbanFilters = (toggle: "group_by" | "sub_group_by", value: string) => {
    if (workspaceSlug && projectId) {
      let kanbanFilters = issuesFilter?.issueFilters?.kanbanFilters?.[toggle] || [];
      if (kanbanFilters.includes(value)) kanbanFilters = kanbanFilters.filter((_value) => _value != value);
      else kanbanFilters.push(value);
      updateFilters(projectId.toString(), EIssueFilterType.KANBAN_FILTERS, {
        [toggle]: kanbanFilters,
      });
    }
  };

  const kanbanFilters = issuesFilter?.issueFilters?.kanbanFilters || { group_by: [], sub_group_by: [] };

  return (
    <>
      <DeleteIssueModal
        dataId={dragState.draggedIssueId}
        isOpen={deleteIssueModal}
        handleClose={() => setDeleteIssueModal(false)}
        onSubmit={handleDeleteIssue}
      />

      {showLoader && issues?.loader === "init-loader" && (
        <div className="fixed right-2 top-16 z-30 flex h-10 w-10 items-center justify-center rounded bg-custom-background-80 shadow-custom-shadow-sm">
          <Spinner className="h-5 w-5" />
        </div>
      )}

      <div
        className="vertical-scrollbar horizontal-scrollbar scrollbar-lg relative flex h-full w-full overflow-auto bg-custom-background-90"
        ref={scrollableContainerRef}
      >
        <div className="relative h-max w-max min-w-full bg-custom-background-90 px-2">
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            {/* drag and delete component */}
            <div
              className={`fixed left-1/2 -translate-x-1/2 ${
                isDragStarted ? "z-40" : ""
              } top-3 mx-3 flex w-72 items-center justify-center`}
            >
              <Droppable droppableId="issue-trash-box" isDropDisabled={!isDragStarted}>
                {(provided, snapshot) => (
                  <div
                    className={`${
                      isDragStarted ? `opacity-100` : `opacity-0`
                    } flex w-full items-center justify-center rounded border-2 border-red-500/20 bg-custom-background-100 px-3 py-5 text-xs font-medium italic text-red-500 ${
                      snapshot.isDraggingOver ? "bg-red-500 opacity-70 blur-2xl" : ""
                    } transition duration-300`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    Drop here to delete the issue.
                  </div>
                )}
              </Droppable>
            </div>

            <div className="h-max w-max">
              <KanBanView
                issuesMap={issueMap}
                issueIds={issueIds}
                displayProperties={displayProperties}
                sub_group_by={sub_group_by}
                group_by={group_by}
                updateIssue={updateIssue}
                quickActions={renderQuickActions}
                handleKanbanFilters={handleKanbanFilters}
                kanbanFilters={kanbanFilters}
                enableQuickIssueCreate={enableQuickAdd}
                showEmptyGroup={userDisplayFilters?.show_empty_groups ?? true}
                quickAddCallback={issues?.quickAddIssue}
                viewId={viewId}
                disableIssueCreation={!enableIssueCreation || !isEditingAllowed || isCompletedCycle}
                canEditProperties={canEditProperties}
                storeType={storeType}
                addIssuesToView={addIssuesToView}
                scrollableContainerRef={scrollableContainerRef}
                isDragStarted={isDragStarted}
              />
            </div>
          </DragDropContext>
        </div>
      </div>
    </>
  );
});
