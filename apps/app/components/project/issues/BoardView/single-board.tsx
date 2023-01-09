import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

import { Draggable } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// services
import workspaceService from "lib/services/workspace.service";
// icons
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { addSpaceIfCamelCase } from "constants/common";
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
// types
import { IIssue, Properties, NestedKeyOf, IWorkspaceMember } from "types";
import SingleIssue from "components/common/board-view/single-issue";

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
            <div
              className={`flex justify-between p-3 pb-0 ${
                !isCollapsed ? "flex-col rounded-md border bg-gray-50" : ""
              }`}
            >
              <div className={`flex items-center ${!isCollapsed ? "flex-col gap-2" : "gap-1"}`}>
                <button
                  type="button"
                  {...provided.dragHandleProps}
                  className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200 ${
                    !isCollapsed ? "" : "rotate-90"
                  } ${selectedGroup !== "state_detail.name" ? "hidden" : ""}`}
                >
                  <EllipsisHorizontalIcon className="h-4 w-4 text-gray-600" />
                  <EllipsisHorizontalIcon className="mt-[-0.7rem] h-4 w-4 text-gray-600" />
                </button>
                <div
                  className={`flex cursor-pointer items-center gap-x-1 rounded-md bg-slate-900 px-2 ${
                    !isCollapsed ? "mb-2 flex-col gap-y-2 py-2" : ""
                  }`}
                  style={{
                    border: `2px solid ${bgColor}`,
                    backgroundColor: `${bgColor}20`,
                  }}
                >
                  <h2
                    className={`text-[0.9rem] font-medium capitalize`}
                    style={{
                      writingMode: !isCollapsed ? "vertical-rl" : "horizontal-tb",
                    }}
                  >
                    {groupTitle === null || groupTitle === "null"
                      ? "None"
                      : createdBy
                      ? createdBy
                      : addSpaceIfCamelCase(groupTitle)}
                  </h2>
                  <span className="ml-0.5 text-sm text-gray-500">
                    {groupedByIssues[groupTitle].length}
                  </span>
                </div>
              </div>

              <div className={`flex items-center ${!isCollapsed ? "flex-col pb-2" : ""}`}>
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200"
                  onClick={() => {
                    setIsCollapsed((prevData) => !prevData);
                  }}
                >
                  {isCollapsed ? (
                    <ArrowsPointingInIcon className="h-4 w-4" />
                  ) : (
                    <ArrowsPointingOutIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-200"
                  onClick={() => {
                    setIsIssueOpen(true);
                    if (selectedGroup !== null)
                      setPreloadedData({
                        state: stateId !== null ? stateId : undefined,
                        [selectedGroup]: groupTitle,
                        actionType: "createIssue",
                      });
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
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

                      return {
                        avatar: tempPerson?.avatar,
                        first_name: tempPerson?.first_name,
                        email: tempPerson?.email,
                      };
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
                    onClick={() => {
                      setIsIssueOpen(true);
                      if (selectedGroup !== null) {
                        setPreloadedData({
                          state: stateId !== null ? stateId : undefined,
                          [selectedGroup]: groupTitle,
                          actionType: "createIssue",
                        });
                      }
                    }}
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
