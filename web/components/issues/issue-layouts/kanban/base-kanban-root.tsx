import { FC, useCallback, useState } from "react";
import { DragDropContext, DropResult, Droppable } from "@hello-pangea/dnd";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Spinner } from "@plane/ui";
// types
import { IIssue } from "types";
import { EIssueActions } from "../types";
import {
  ICycleIssuesFilterStore,
  ICycleIssuesStore,
  IModuleIssuesFilterStore,
  IModuleIssuesStore,
  IProfileIssuesFilterStore,
  IProfileIssuesStore,
  IProjectDraftIssuesStore,
  IProjectIssuesFilterStore,
  IProjectIssuesStore,
  IViewIssuesFilterStore,
  IViewIssuesStore,
} from "store/issues";
import { IQuickActionProps } from "../list/list-view-types";
import { IIssueKanBanViewStore } from "store/issue";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";
//components
import { KanBan } from "./default";
import { KanBanSwimLanes } from "./swimlanes";
import { EProjectStore } from "store/command-palette.store";
import { IssuePeekOverview } from "components/issues";
import { EUserWorkspaceRoles } from "constants/workspace";

export interface IBaseKanBanLayout {
  issueStore:
    | IProjectIssuesStore
    | IModuleIssuesStore
    | ICycleIssuesStore
    | IViewIssuesStore
    | IProjectDraftIssuesStore
    | IProfileIssuesStore;
  issuesFilterStore:
    | IProjectIssuesFilterStore
    | IModuleIssuesFilterStore
    | ICycleIssuesFilterStore
    | IViewIssuesFilterStore
    | IProfileIssuesFilterStore;
  kanbanViewStore: IIssueKanBanViewStore;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (issue: IIssue) => void;
    [EIssueActions.UPDATE]?: (issue: IIssue) => void;
    [EIssueActions.REMOVE]?: (issue: IIssue) => void;
  };
  showLoader?: boolean;
  viewId?: string;
  currentStore?: EProjectStore;
  handleDragDrop?: (
    source: any,
    destination: any,
    subGroupBy: string | null,
    groupBy: string | null,
    issues: any,
    issueWithIds: any
  ) => void;
  addIssuesToView?: (issueIds: string[]) => Promise<IIssue>;
}

export const BaseKanBanRoot: React.FC<IBaseKanBanLayout> = observer((props: IBaseKanBanLayout) => {
  const {
    issueStore,
    issuesFilterStore,
    kanbanViewStore,
    QuickActions,
    issueActions,
    showLoader,
    viewId,
    currentStore,
    handleDragDrop,
    addIssuesToView,
  } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, peekIssueId, peekProjectId } = router.query;
  // mobx store
  const {
    project: { workspaceProjects },
    projectLabel: { projectLabels },
    projectMember: { projectMembers },
    projectState: projectStateStore,
    user: userStore,
  } = useMobxStore();

  const { currentProjectRole } = userStore;
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserWorkspaceRoles.MEMBER;

  const issues = issueStore?.getIssues || {};
  const issueIds = issueStore?.getIssuesIds || [];

  const displayFilters = issuesFilterStore?.issueFilters?.displayFilters;
  const displayProperties = issuesFilterStore?.issueFilters?.displayProperties || null;

  const sub_group_by: string | null = displayFilters?.sub_group_by || null;

  const group_by: string | null = displayFilters?.group_by || null;

  const order_by: string | null = displayFilters?.order_by || null;

  const userDisplayFilters = displayFilters || null;

  const currentKanBanView: "swimlanes" | "default" = sub_group_by ? "swimlanes" : "default";

  const { enableInlineEditing, enableQuickAdd, enableIssueCreation } = issueStore?.viewFlags || {};

  const [isDragStarted, setIsDragStarted] = useState<boolean>(false);
  const onDragStart = () => {
    setIsDragStarted(true);
  };

  const onDragEnd = (result: DropResult) => {
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

    if (handleDragDrop) handleDragDrop(result.source, result.destination, sub_group_by, group_by, issues, issueIds);
  };

  const handleIssues = useCallback(
    async (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: EIssueActions) => {
      if (issueActions[action]) {
        issueActions[action]!(issue);
      }
    },
    [issueActions]
  );

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    kanbanViewStore.handleKanBanToggle(toggle, value);
  };

  const states = projectStateStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;

  return (
    <>
      {showLoader && issueStore?.loader === "init-loader" && (
        <div className="fixed top-16 right-2 z-30 bg-custom-background-80 shadow-custom-shadow-sm w-10 h-10 rounded flex justify-center items-center">
          <Spinner className="w-5 h-5" />
        </div>
      )}

      <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90 px-3`}>
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div
            className={`fixed left-1/2 -translate-x-1/2 ${
              isDragStarted ? "z-40" : ""
            } w-72 top-3 flex items-center justify-center mx-3`}
          >
            <Droppable droppableId="issue-trash-box" isDropDisabled={!isDragStarted}>
              {(provided, snapshot) => (
                <div
                  className={`${
                    isDragStarted ? `opacity-100` : `opacity-0`
                  } w-full flex items-center justify-center rounded border-2 border-red-500/20 bg-custom-background-100 px-3 py-5 text-xs font-medium italic text-red-500 ${
                    snapshot.isDraggingOver ? "bg-red-500 blur-2xl opacity-70" : ""
                  } transition duration-300`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  Drop here to delete the issue.
                </div>
              )}
            </Droppable>
          </div>

          {currentKanBanView === "default" ? (
            <KanBan
              issues={issues}
              issueIds={issueIds}
              sub_group_by={sub_group_by}
              group_by={group_by}
              order_by={order_by}
              handleIssues={handleIssues}
              quickActions={(sub_group_by, group_by, issue) => (
                <QuickActions
                  issue={issue}
                  handleDelete={async () => handleIssues(sub_group_by, group_by, issue, EIssueActions.DELETE)}
                  handleUpdate={
                    issueActions[EIssueActions.UPDATE]
                      ? async (data) => handleIssues(sub_group_by, group_by, data, EIssueActions.UPDATE)
                      : undefined
                  }
                  handleRemoveFromView={
                    issueActions[EIssueActions.REMOVE]
                      ? async () => handleIssues(sub_group_by, group_by, issue, EIssueActions.REMOVE)
                      : undefined
                  }
                />
              )}
              displayProperties={displayProperties}
              kanBanToggle={kanbanViewStore?.kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
              states={states}
              stateGroups={stateGroups}
              priorities={priorities}
              labels={projectLabels}
              members={projectMembers?.map((m) => m.member) ?? null}
              projects={workspaceProjects}
              enableQuickIssueCreate={enableQuickAdd}
              showEmptyGroup={userDisplayFilters?.show_empty_groups || true}
              isDragStarted={isDragStarted}
              quickAddCallback={issueStore?.quickAddIssue}
              viewId={viewId}
              disableIssueCreation={!enableIssueCreation || !isEditingAllowed}
              isReadOnly={!enableInlineEditing || !isEditingAllowed}
              currentStore={currentStore}
              addIssuesToView={addIssuesToView}
            />
          ) : (
            <KanBanSwimLanes
              issues={issues}
              issueIds={issueIds}
              sub_group_by={sub_group_by}
              group_by={group_by}
              order_by={order_by}
              handleIssues={handleIssues}
              quickActions={(sub_group_by, group_by, issue) => (
                <QuickActions
                  issue={issue}
                  handleDelete={async () => handleIssues(sub_group_by, group_by, issue, EIssueActions.DELETE)}
                  handleUpdate={
                    issueActions[EIssueActions.UPDATE]
                      ? async (data) => handleIssues(sub_group_by, group_by, data, EIssueActions.UPDATE)
                      : undefined
                  }
                  handleRemoveFromView={
                    issueActions[EIssueActions.REMOVE]
                      ? async () => handleIssues(sub_group_by, group_by, issue, EIssueActions.REMOVE)
                      : undefined
                  }
                />
              )}
              displayProperties={displayProperties}
              kanBanToggle={kanbanViewStore?.kanBanToggle}
              handleKanBanToggle={handleKanBanToggle}
              states={states}
              stateGroups={stateGroups}
              priorities={priorities}
              labels={projectLabels}
              members={projectMembers?.map((m) => m.member) ?? null}
              projects={workspaceProjects}
              showEmptyGroup={userDisplayFilters?.show_empty_groups || true}
              isDragStarted={isDragStarted}
              disableIssueCreation={true}
              enableQuickIssueCreate={enableQuickAdd}
              isReadOnly={!enableInlineEditing || !isEditingAllowed}
              currentStore={currentStore}
              quickAddCallback={issueStore?.quickAddIssue}
              addIssuesToView={(issues) => {
                console.log("kanban existingIds", issues);

                return Promise.resolve({} as IIssue);
              }}
            />
          )}
        </DragDropContext>
      </div>

      {workspaceSlug && peekIssueId && peekProjectId && (
        <IssuePeekOverview
          workspaceSlug={workspaceSlug.toString()}
          projectId={peekProjectId.toString()}
          issueId={peekIssueId.toString()}
          handleIssue={(issueToUpdate) =>
            handleIssues(sub_group_by, group_by, issueToUpdate as IIssue, EIssueActions.UPDATE)
          }
        />
      )}
    </>
  );
});
