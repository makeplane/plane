import { useState } from "react";

import { useRouter } from "next/router";

// react-beautiful-dnd
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { Draggable, DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
// components
import { BoardHeader, SingleBoardIssue } from "components/core";
// ui
import { CustomMenu } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IProjectMember, NestedKeyOf, UserAuth } from "types";

type Props = {
  type?: "issue" | "cycle" | "module";
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  bgColor?: string;
  groupTitle: string;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  selectedGroup: NestedKeyOf<IIssue> | null;
  members: IProjectMember[] | undefined;
  addIssueToState: () => void;
  handleDeleteIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  userAuth: UserAuth;
};

export const SingleBoard: React.FC<Props> = ({
  type = "issue",
  provided,
  snapshot,
  bgColor,
  groupTitle,
  groupedByIssues,
  selectedGroup,
  members,
  addIssueToState,
  handleDeleteIssue,
  openIssuesListModal,
  userAuth,
}) => {
  // collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(true);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const createdBy =
    selectedGroup === "created_by"
      ? members?.find((m) => m.member.id === groupTitle)?.member.first_name ?? "loading..."
      : null;

  if (selectedGroup === "priority")
    groupTitle === "high"
      ? (bgColor = "#dc2626")
      : groupTitle === "medium"
      ? (bgColor = "#f97316")
      : groupTitle === "low"
      ? (bgColor = "#22c55e")
      : (bgColor = "#ff0000");

  return (
    <div
      className={`h-full flex-shrink-0 rounded ${
        snapshot && snapshot.isDragging ? "border-theme shadow-lg" : ""
      } ${!isCollapsed ? "" : "w-80 border bg-gray-50"}`}
      ref={provided?.innerRef}
      {...provided?.draggableProps}
    >
      <div className={`${!isCollapsed ? "" : "flex h-full flex-col space-y-3 overflow-y-auto"}`}>
        <BoardHeader
          provided={provided}
          addIssueToState={addIssueToState}
          bgColor={bgColor}
          createdBy={createdBy}
          groupTitle={groupTitle}
          groupedByIssues={groupedByIssues}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          selectedGroup={selectedGroup}
        />
        <StrictModeDroppable key={groupTitle} droppableId={groupTitle}>
          {(provided, snapshot) => (
            <div
              className={`mt-3 h-full space-y-3 overflow-y-auto px-3 pb-3 ${
                snapshot.isDraggingOver ? "bg-indigo-50 bg-opacity-50" : ""
              } ${!isCollapsed ? "hidden" : "block"}`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {groupedByIssues[groupTitle].map((childIssue, index: number) => {
                const assignees = [
                  ...(childIssue?.assignees_list ?? []),
                  ...(childIssue?.assignees ?? []),
                ]?.map((assignee) => {
                  const tempPerson = members?.find((p) => p.member.id === assignee)?.member;

                  return tempPerson;
                });

                return (
                  <Draggable key={childIssue.id} draggableId={childIssue.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <SingleBoardIssue
                          issue={childIssue}
                          properties={properties}
                          snapshot={snapshot}
                          people={members}
                          assignees={assignees}
                          handleDeleteIssue={handleDeleteIssue}
                          userAuth={userAuth}
                        />
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              {type === "issue" ? (
                <button
                  type="button"
                  className="flex items-center rounded p-2 text-xs font-medium outline-none duration-300 hover:bg-gray-100"
                  onClick={addIssueToState}
                >
                  <PlusIcon className="mr-1 h-3 w-3" />
                  Create
                </button>
              ) : (
                <CustomMenu
                  label={
                    <span className="flex items-center gap-1">
                      <PlusIcon className="h-3 w-3" />
                      Add issue
                    </span>
                  }
                  className="mt-1"
                  optionsPosition="left"
                  noBorder
                >
                  <CustomMenu.MenuItem onClick={addIssueToState}>Create new</CustomMenu.MenuItem>
                  {openIssuesListModal && (
                    <CustomMenu.MenuItem onClick={openIssuesListModal}>
                      Add an existing issue
                    </CustomMenu.MenuItem>
                  )}
                </CustomMenu>
              )}
            </div>
          )}
        </StrictModeDroppable>
      </div>
    </div>
  );
};
