import { useState, useEffect } from "react";

import { useRouter } from "next/router";

// react-beautiful-dnd
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { Draggable } from "react-beautiful-dnd";
// hooks
import useIssuesView from "hooks/use-issues-view";
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
import { IIssue, IState, UserAuth } from "types";

type Props = {
  type?: "issue" | "cycle" | "module";
  currentState?: IState | null;
  groupTitle: string;
  handleEditIssue: (issue: IIssue) => void;
  makeIssueCopy: (issue: IIssue) => void;
  addIssueToState: () => void;
  handleDeleteIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  handleTrashBox: (isDragging: boolean) => void;
  removeIssue: ((bridgeId: string) => void) | null;
  isCompleted?: boolean;
  userAuth: UserAuth;
};

export const SingleBoard: React.FC<Props> = ({
  type,
  currentState,
  groupTitle,
  handleEditIssue,
  makeIssueCopy,
  addIssueToState,
  handleDeleteIssue,
  openIssuesListModal,
  handleTrashBox,
  removeIssue,
  isCompleted = false,
  userAuth,
}) => {
  // collapse/expand
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { groupedByIssues, groupByProperty: selectedGroup, orderBy } = useIssuesView();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || isCompleted;

  useEffect(() => {
    if (currentState?.group === "completed" || currentState?.group === "cancelled")
      setIsCollapsed(false);
  }, [currentState]);

  return (
    <div className={`h-full flex-shrink-0 ${!isCollapsed ? "" : "w-96 bg-brand-base"}`}>
      <div className={`${!isCollapsed ? "" : "flex h-full flex-col space-y-3"}`}>
        <BoardHeader
          addIssueToState={addIssueToState}
          currentState={currentState}
          groupTitle={groupTitle}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isCompleted={isCompleted}
        />
        {isCollapsed && (
          <StrictModeDroppable key={groupTitle} droppableId={groupTitle}>
            {(provided, snapshot) => (
              <div
                className={`relative h-full overflow-y-auto p-1  ${
                  snapshot.isDraggingOver ? "bg-brand-accent bg-opacity-50" : ""
                } ${!isCollapsed ? "hidden" : "block"}`}
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {orderBy !== "sort_order" && (
                  <>
                    <div
                      className={`absolute ${
                        snapshot.isDraggingOver ? "block" : "hidden"
                      } pointer-events-none top-0 left-0 z-[99] h-full w-full bg-brand-surface-1 opacity-50`}
                    />
                    <div
                      className={`absolute ${
                        snapshot.isDraggingOver ? "block" : "hidden"
                      } pointer-events-none top-1/2 left-1/2 z-[99] -translate-y-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-brand-surface-2 p-2 text-xs`}
                    >
                      This board is ordered by{" "}
                      {replaceUnderscoreIfSnakeCase(orderBy ?? "created_at")}
                    </div>
                  </>
                )}
                {groupedByIssues?.[groupTitle].map((issue, index) => (
                  <Draggable
                    key={issue.id}
                    draggableId={issue.id}
                    index={index}
                    isDragDisabled={
                      isNotAllowed || selectedGroup === "created_by" || selectedGroup === "labels"
                    }
                  >
                    {(provided, snapshot) => (
                      <SingleBoardIssue
                        key={index}
                        provided={provided}
                        snapshot={snapshot}
                        type={type}
                        index={index}
                        selectedGroup={selectedGroup}
                        issue={issue}
                        groupTitle={groupTitle}
                        properties={properties}
                        editIssue={() => handleEditIssue(issue)}
                        makeIssueCopy={() => makeIssueCopy(issue)}
                        handleDeleteIssue={handleDeleteIssue}
                        handleTrashBox={handleTrashBox}
                        removeIssue={() => {
                          if (removeIssue && issue.bridge_id) removeIssue(issue.bridge_id);
                        }}
                        isCompleted={isCompleted}
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
                    className="flex items-center gap-2 font-medium text-brand-accent outline-none"
                    onClick={addIssueToState}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Issue
                  </button>
                ) : (
                  !isCompleted && (
                    <CustomMenu
                      customButton={
                        <button
                          type="button"
                          className="flex items-center gap-2 font-medium text-brand-accent outline-none"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add Issue
                        </button>
                      }
                      optionsPosition="left"
                      noBorder
                    >
                      <CustomMenu.MenuItem onClick={addIssueToState}>
                        Create new
                      </CustomMenu.MenuItem>
                      {openIssuesListModal && (
                        <CustomMenu.MenuItem onClick={openIssuesListModal}>
                          Add an existing issue
                        </CustomMenu.MenuItem>
                      )}
                    </CustomMenu>
                  )
                )}
              </div>
            )}
          </StrictModeDroppable>
        )}
      </div>
    </div>
  );
};
