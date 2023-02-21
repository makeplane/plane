import { useState } from "react";

import { useRouter } from "next/router";

// react-beautiful-dnd
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { Draggable } from "react-beautiful-dnd";
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
  bgColor?: string;
  groupTitle: string;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  selectedGroup: NestedKeyOf<IIssue> | null;
  members: IProjectMember[] | undefined;
  handleEditIssue: (issue: IIssue) => void;
  addIssueToState: () => void;
  handleDeleteIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  orderBy: NestedKeyOf<IIssue> | null;
  handleTrashBox: (isDragging: boolean) => void;
  removeIssue: ((bridgeId: string) => void) | null;
  userAuth: UserAuth;
};

export const SingleBoard: React.FC<Props> = ({
  type,
  bgColor,
  groupTitle,
  groupedByIssues,
  selectedGroup,
  members,
  handleEditIssue,
  addIssueToState,
  handleDeleteIssue,
  openIssuesListModal,
  orderBy,
  handleTrashBox,
  removeIssue,
  userAuth,
}) => {
  // collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(true);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  if (selectedGroup === "priority")
    groupTitle === "high"
      ? (bgColor = "#dc2626")
      : groupTitle === "medium"
      ? (bgColor = "#f97316")
      : groupTitle === "low"
      ? (bgColor = "#22c55e")
      : (bgColor = "#ff0000");

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div className={`h-full flex-shrink-0 rounded ${!isCollapsed ? "" : "w-80 border bg-gray-50"}`}>
      <div className={`${!isCollapsed ? "" : "flex h-full flex-col space-y-3 overflow-y-auto"}`}>
        <BoardHeader
          addIssueToState={addIssueToState}
          bgColor={bgColor}
          selectedGroup={selectedGroup}
          groupTitle={groupTitle}
          groupedByIssues={groupedByIssues}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          members={members}
        />
        <StrictModeDroppable key={groupTitle} droppableId={groupTitle}>
          {(provided, snapshot) => (
            <div
              className={`relative mt-3 h-full space-y-3 px-3 pb-3 ${
                snapshot.isDraggingOver ? "bg-indigo-50 bg-opacity-50" : ""
              } ${!isCollapsed ? "hidden" : "block"}`}
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {orderBy !== "sort_order" && (
                <>
                  <div
                    className={`absolute ${
                      snapshot.isDraggingOver ? "block" : "hidden"
                    } top-0 left-0 h-full w-full bg-indigo-200 opacity-50 pointer-events-none z-[99999998]`}
                  />
                  <div
                    className={`absolute ${
                      snapshot.isDraggingOver ? "block" : "hidden"
                    } top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-xs whitespace-nowrap bg-white p-2 rounded pointer-events-none z-[99999999]`}
                  >
                    This board is order by {orderBy}
                  </div>
                </>
              )}
              {groupedByIssues[groupTitle].map((issue, index: number) => (
                <Draggable
                  key={issue.id}
                  draggableId={issue.id}
                  index={index}
                  isDragDisabled={
                    isNotAllowed || selectedGroup === "created_by" || selectedGroup === "assignees"
                  }
                >
                  {(provided, snapshot) => (
                    <SingleBoardIssue
                      key={index}
                      provided={provided}
                      snapshot={snapshot}
                      type={type}
                      issue={issue}
                      selectedGroup={selectedGroup}
                      properties={properties}
                      editIssue={() => handleEditIssue(issue)}
                      handleDeleteIssue={handleDeleteIssue}
                      orderBy={orderBy}
                      handleTrashBox={handleTrashBox}
                      removeIssue={() => {
                        removeIssue && removeIssue(issue.bridge);
                      }}
                      userAuth={userAuth}
                    />
                  )}
                </Draggable>
              ))}
              <span
                style={{
                  display: orderBy === "sort_order" ? "inline" : "none",
                }}
              >
                {provided.placeholder}
              </span>
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
