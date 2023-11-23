import { FC, useCallback, useState } from "react";
import { useRouter } from "next/router";
import { DragDropContext } from "@hello-pangea/dnd";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Spinner } from "@plane/ui";
// types
import { IIssue } from "types";
import { EIssueActions } from "../types";
import { ICycleIssuesStore, IModuleIssuesStore, IProjectIssuesStore, IViewIssuesStore } from "store/issues";
import { IQuickActionProps } from "../list/list-view-types";
import { IIssueKanBanViewStore } from "store/issue";
// constants
import { ISSUE_STATE_GROUPS, ISSUE_PRIORITIES } from "constants/issue";
//components
import { KanBan } from "./default";
import { KanBanSwimLanes } from "./swimlanes";

export interface IBaseKanBanLayout {
  issueStore: IProjectIssuesStore | IModuleIssuesStore | ICycleIssuesStore | IViewIssuesStore;
  kanbanViewStore: IIssueKanBanViewStore;
  QuickActions: FC<IQuickActionProps>;
  issueActions: {
    [EIssueActions.DELETE]: (issue: IIssue) => void;
    [EIssueActions.UPDATE]?: (issue: IIssue) => void;
    [EIssueActions.REMOVE]?: (issue: IIssue) => void;
  };
  showLoader?: boolean;
  viewId?: string;
}

export const BaseKanBanRoot: React.FC<IBaseKanBanLayout> = observer((props: IBaseKanBanLayout) => {
  const { issueStore, kanbanViewStore, QuickActions, issueActions, showLoader, viewId } = props;

  const {
    project: { workspaceProjects },
    projectLabel: { projectLabels },
    projectMember: { projectMembers },
    projectState: projectStateStore,
    projectIssuesFilter: issueFilterStore,
  } = useMobxStore();

  const issues = issueStore?.getIssues || {};
  const issueIds = issueStore?.getIssuesIds || [];

  const displayFilters = issueFilterStore?.issueFilters?.displayFilters;
  const displayProperties = issueFilterStore?.issueFilters?.displayProperties || null;

  const sub_group_by: string | null = displayFilters?.sub_group_by || null;

  const group_by: string | null = displayFilters?.group_by || null;

  const order_by: string | null = displayFilters?.order_by || null;

  const userDisplayFilters = displayFilters || null;

  const currentKanBanView: "swimlanes" | "default" = sub_group_by ? "swimlanes" : "default";

  const [isDragStarted, setIsDragStarted] = useState<boolean>(false);

  const onDragStart = () => {
    setIsDragStarted(true);
  };

  const onDragEnd = (result: any) => {
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

    currentKanBanView === "default"
      ? kanbanViewStore?.handleDragDrop(result.source, result.destination)
      : kanbanViewStore?.handleSwimlaneDragDrop(result.source, result.destination);
  };

  const handleIssues = useCallback(
    async (sub_group_by: string | null, group_by: string | null, issue: IIssue, action: EIssueActions) => {
      if (issueActions[action]) {
        issueActions[action]!(issue);
      }
    },
    [issueStore]
  );

  const handleKanBanToggle = (toggle: "groupByHeaderMinMax" | "subgroupByIssuesVisibility", value: string) => {
    kanbanViewStore.handleKanBanToggle(toggle, value);
  };

  const states = projectStateStore?.projectStates || null;
  const priorities = ISSUE_PRIORITIES || null;
  const stateGroups = ISSUE_STATE_GROUPS || null;

  return (
    <>
      {showLoader && issueStore?.loader === "mutation" && (
        <div className="fixed top-16 right-2 z-30 bg-custom-background-80 shadow-custom-shadow-sm w-10 h-10 rounded flex justify-center items-center">
          <Spinner className="w-5 h-5" />
        </div>
      )}

      <div className={`relative min-w-full w-max min-h-full h-max bg-custom-background-90 px-3`}>
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
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
              enableQuickIssueCreate
              showEmptyGroup={userDisplayFilters?.show_empty_groups || true}
              isDragStarted={isDragStarted}
              quickAddCallback={issueStore.quickAddIssue}
              viewId={viewId}
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
            />
          )}
        </DragDropContext>
      </div>
    </>
  );
});
