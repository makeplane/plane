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
import { IIssue, IProjectMember, IState, UserAuth } from "types";

type Props = {
  type?: "issue" | "cycle" | "module";
  currentState?: IState | null;
  groupTitle: string;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  selectedGroup: "state" | "priority" | "labels" | null;
  handleEditIssue: (issue: IIssue) => void;
  makeIssueCopy: (issue: IIssue) => void;
  addIssueToState: () => void;
  handleDeleteIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  orderBy: "created_at" | "updated_at" | "priority" | "sort_order";
  handleTrashBox: (isDragging: boolean) => void;
  removeIssue: ((bridgeId: string) => void) | null;
  userAuth: UserAuth;
};

export const SingleBoard: React.FC<Props> = ({
  type,
  currentState,
  groupTitle,
  groupedByIssues,
  selectedGroup,
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

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div className={`h-full flex-shrink-0 rounded ${!isCollapsed ? "" : "w-96 bg-gray-50"}`}>
      <div className={`${!isCollapsed ? "" : "flex h-full flex-col space-y-3"}`}>
        <BoardHeader
          addIssueToState={addIssueToState}
          currentState={currentState}
          selectedGroup={selectedGroup}
          groupTitle={groupTitle}
          groupedByIssues={groupedByIssues}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
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
                    } pointer-events-none top-0 left-0 z-[99999998] h-full w-full bg-indigo-200 opacity-50`}
                  />
                  <div
                    className={`absolute ${
                      snapshot.isDraggingOver ? "block" : "hidden"
                    } pointer-events-none top-1/2 left-1/2 z-[99999999] -translate-y-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-white p-2 text-xs`}
                  >
                    This board is ordered by {replaceUnderscoreIfSnakeCase(orderBy)}
                  </div>
                </>
              )}
              {groupedByIssues[groupTitle].map((issue, index: number) => (
                <Draggable
                  key={issue.id}
                  draggableId={issue.id}
                  index={index}
                  isDragDisabled={isNotAllowed}
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
