import { FC, useCallback, useState } from "react";
import { DragDropContext, DragStart, DraggableLocation, DropResult, Droppable } from "@hello-pangea/dnd";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// ui
import { Spinner } from "@plane/ui";
// types
import { TIssue } from "@plane/types";
import { EIssueActions } from "../types";
import { IQuickActionProps } from "../list/list-view-types";
import { IProjectIssues, IProjectIssuesFilter } from "store/issue/project";
//components
import { KanBan } from "./default";
import { KanBanSwimLanes } from "./swimlanes";
import { DeleteIssueModal } from "components/issues";
import { EUserProjectRoles } from "constants/project";
import { useIssues } from "hooks/store/use-issues";
import { handleDragDrop } from "./utils";
import { ICycleIssues, ICycleIssuesFilter } from "store/issue/cycle";
import { IDraftIssues, IDraftIssuesFilter } from "store/issue/draft";
import { IProfileIssues, IProfileIssuesFilter } from "store/issue/profile";
import { IModuleIssues, IModuleIssuesFilter } from "store/issue/module";
import { IProjectViewIssues, IProjectViewIssuesFilter } from "store/issue/project-views";
import { EIssueFilterType, TCreateModalStoreTypes } from "constants/issue";

export interface IBaseKanBanLayout {
  issues: IProjectIssues | ICycleIssues | IDraftIssues | IModuleIssues | IProjectViewIssues | IProfileIssues;
  issuesFilter:
    | IProjectIssuesFilter
    | IModuleIssuesFilter
    | ICycleIssuesFilter
    | IDraftIssuesFilter
    | IProjectViewIssuesFilter
    | IProfileIssuesFilter;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (issue: TIssue) => Promise<void>;
    [EIssueActions.UPDATE]?: (issue: TIssue) => Promise<void>;
    [EIssueActions.REMOVE]?: (issue: TIssue) => Promise<void>;
  };
  showLoader?: boolean;
  viewId?: string;
  storeType?: TCreateModalStoreTypes;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
}

type KanbanDragState = {
  draggedIssueId?: string | null;
  source?: DraggableLocation | null;
  destination?: DraggableLocation | null;
};

export const BaseKanBanRoot: React.FC<IBaseKanBanLayout> = observer((props: IBaseKanBanLayout) => {
  const {
    issues,
    issuesFilter,
    QuickActions,
    issueActions,
    showLoader,
    viewId,
    storeType,
    addIssuesToView,
    canEditPropertiesBasedOnProject,
  } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { issueMap } = useIssues();
  // toast alert
  const { setToastAlert } = useToast();

  const issueIds = issues?.groupedIssueIds || [];

  const displayFilters = issuesFilter?.issueFilters?.displayFilters;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;

  const sub_group_by: string | null = displayFilters?.sub_group_by || null;
  const group_by: string | null = displayFilters?.group_by || null;

  const userDisplayFilters = displayFilters || null;

  const KanBanView = sub_group_by ? KanBanSwimLanes : KanBan;

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issues?.viewFlags || {};

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
          issues,
          sub_group_by,
          group_by,
          issueMap,
          issueIds,
          viewId
        ).catch((err) => {
          setToastAlert({
            title: "Error",
            type: "error",
            message: err.detail ?? "Failed to perform this action",
          });
        });
      }
    }
  };

  const handleIssues = useCallback(
    async (issue: TIssue, action: EIssueActions) => {
      if (issueActions[action]) {
        await issueActions[action]!(issue);
      }
    },
    [issueActions]
  );

  const renderQuickActions = useCallback(
    (issue: TIssue, customActionButton?: React.ReactElement) => (
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
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [issueActions, handleIssues]
  );

  const handleDeleteIssue = async () => {
    if (!handleDragDrop) return;
    await handleDragDrop(
      dragState.source,
      dragState.destination,
      workspaceSlug?.toString(),
      projectId?.toString(),
      issues,
      sub_group_by,
      group_by,
      issueMap,
      issueIds,
      viewId
    ).finally(() => {
      handleIssues(issueMap[dragState.draggedIssueId!], EIssueActions.DELETE);
      setDeleteIssueModal(false);
      setDragState({});
    });
  };

  const handleKanbanFilters = (toggle: "group_by" | "sub_group_by", value: string) => {
    if (workspaceSlug && projectId) {
      let _kanbanFilters = issuesFilter?.issueFilters?.kanbanFilters?.[toggle] || [];
      if (_kanbanFilters.includes(value)) _kanbanFilters = _kanbanFilters.filter((_value) => _value != value);
      else _kanbanFilters.push(value);
      issuesFilter.updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.KANBAN_FILTERS, {
        [toggle]: _kanbanFilters,
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

      <div className="horizontal-scroll-enable relative h-full w-full overflow-auto bg-custom-background-90">
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

            <KanBanView
              issuesMap={issueMap}
              issueIds={issueIds}
              displayProperties={displayProperties}
              sub_group_by={sub_group_by}
              group_by={group_by}
              handleIssues={handleIssues}
              quickActions={renderQuickActions}
              handleKanbanFilters={handleKanbanFilters}
              kanbanFilters={kanbanFilters}
              enableQuickIssueCreate={enableQuickAdd}
              showEmptyGroup={userDisplayFilters?.show_empty_groups || true}
              quickAddCallback={issues?.quickAddIssue}
              viewId={viewId}
              disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
              canEditProperties={canEditProperties}
              storeType={storeType}
              addIssuesToView={addIssuesToView}
            />
          </DragDropContext>
        </div>
      </div>
    </>
  );
});
