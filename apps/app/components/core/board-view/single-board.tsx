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
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { IIssue, IProjectMember, IState, NestedKeyOf, UserAuth } from "types";

type Props = {
  type?: "issue" | "cycle" | "module";
  currentState?: IState | null;
  bgColor?: string;
  groupTitle: string;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  selectedGroup: NestedKeyOf<IIssue> | null;
  members: IProjectMember[] | undefined;
  handleEditIssue: (issue: IIssue) => void;
  makeIssueCopy: (issue: IIssue) => void;
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
  currentState,
  bgColor,
  groupTitle,
  groupedByIssues,
  selectedGroup,
  members,
  handleEditIssue,
  makeIssueCopy,
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
    <div className={`h-full flex-shrink-0 rounded ${!isCollapsed ? "" : "w-96 bg-gray-50"}`}>
      <div className={`${!isCollapsed ? "" : "flex h-full flex-col space-y-3"}`}>
        <BoardHeader
          addIssueToState={addIssueToState}
          currentState={currentState}
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
              className={`relative h-full overflow-y-auto p-1  ${
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
                    } pointer-events-none top-0 left-0 z-[99] h-full w-full bg-gray-100 opacity-50`}
                  />
                  <div
                    className={`absolute ${
                      snapshot.isDraggingOver ? "block" : "hidden"
                    } pointer-events-none top-1/2 left-1/2 z-[99] -translate-y-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white p-2 text-xs`}
                  >
                    This board is ordered by {replaceUnderscoreIfSnakeCase(orderBy ?? "created_at")}
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
                      makeIssueCopy={() => makeIssueCopy(issue)}
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
                  className="flex items-center gap-2 font-medium text-theme outline-none"
                  onClick={addIssueToState}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Issue
                </button>
              ) : (
                <CustomMenu
                  customButton={
                    <button
                      type="button"
                      className="flex items-center gap-2 font-medium text-theme outline-none"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Issue
                    </button>
                  }
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
