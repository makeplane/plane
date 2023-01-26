import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-beautiful-dnd
import { Draggable } from "react-beautiful-dnd";
// components
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import SingleIssue from "components/common/board-view/single-issue";
import BoardHeader from "components/common/board-view/board-header";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// services
import workspaceService from "services/workspace.service";
// types
import { IIssue, Properties, NestedKeyOf, IWorkspaceMember } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";

type Props = {
  selectedGroup: NestedKeyOf<IIssue> | null;
  groupTitle: string;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  index: number;
  setIsIssueOpen: React.Dispatch<React.SetStateAction<boolean>>;
  properties: Properties;
  setPreloadedData: React.Dispatch<
    React.SetStateAction<
      | (Partial<IIssue> & {
          actionType: "createIssue" | "edit" | "delete";
        })
      | undefined
    >
  >;
  bgColor?: string;
  stateId: string | null;
  createdBy: string | null;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  partialUpdateIssue: (formData: Partial<IIssue>, childIssueId: string) => void;
};

const SingleBoard: React.FC<Props> = ({
  selectedGroup,
  groupTitle,
  groupedByIssues,
  index,
  setIsIssueOpen,
  properties,
  setPreloadedData,
  bgColor = "#0f2b16",
  stateId,
  createdBy,
  handleDeleteIssue,
  partialUpdateIssue,
}) => {
  // Collapse/Expand
  const [isCollapsed, setIsCollapsed] = useState(true);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  if (selectedGroup === "priority")
    groupTitle === "high"
      ? (bgColor = "#dc2626")
      : groupTitle === "medium"
      ? (bgColor = "#f97316")
      : groupTitle === "low"
      ? (bgColor = "#22c55e")
      : (bgColor = "#ff0000");

  const { data: people } = useSWR<IWorkspaceMember[]>(
    workspaceSlug ? WORKSPACE_MEMBERS : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  const addIssueToState = () => {
    setIsIssueOpen(true);
    if (selectedGroup)
      setPreloadedData({
        state: stateId !== null ? stateId : undefined,
        [selectedGroup]: groupTitle,
        actionType: "createIssue",
      });
  };

  return (
    <Draggable draggableId={groupTitle} index={index}>
      {(provided, snapshot) => (
        <div
          className={`h-full flex-shrink-0 rounded ${
            snapshot.isDragging ? "border-theme shadow-lg" : ""
          } ${!isCollapsed ? "" : "w-80 border bg-gray-50"}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div
            className={`${!isCollapsed ? "" : "flex h-full flex-col space-y-3 overflow-y-auto"}`}
          >
            <BoardHeader
              addIssueToState={addIssueToState}
              bgColor={bgColor}
              createdBy={createdBy}
              groupTitle={groupTitle}
              groupedByIssues={groupedByIssues}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              selectedGroup={selectedGroup}
              provided={provided}
            />
            <StrictModeDroppable key={groupTitle} droppableId={groupTitle}>
              {(provided, snapshot) => (
                <div
                  className={`mt-3 h-full space-y-3 overflow-y-auto px-3 pb-3 ${
                    snapshot.isDraggingOver ? "bg-indigo-50 bg-opacity-50" : ""
                  } ${!isCollapsed ? "hidden" : "block"}`}
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {groupedByIssues[groupTitle].map((childIssue, index: number) => {
                    const assignees = [
                      ...(childIssue?.assignees_list ?? []),
                      ...(childIssue?.assignees ?? []),
                    ]?.map((assignee) => {
                      const tempPerson = people?.find((p) => p.member.id === assignee)?.member;

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
                            <SingleIssue
                              issue={childIssue}
                              properties={properties}
                              snapshot={snapshot}
                              people={people}
                              assignees={assignees}
                              handleDeleteIssue={handleDeleteIssue}
                              partialUpdateIssue={partialUpdateIssue}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                  <button
                    type="button"
                    className="flex items-center rounded p-2 text-xs font-medium outline-none duration-300 hover:bg-gray-100"
                    onClick={addIssueToState}
                  >
                    <PlusIcon className="mr-1 h-3 w-3" />
                    Create
                  </button>
                </div>
              )}
            </StrictModeDroppable>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default SingleBoard;
