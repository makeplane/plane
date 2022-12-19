// react
import React, { useState } from "react";
// swr
import useSWR from "swr";
// react-beautiful-dnd
import { Draggable } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
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
  const [show, setShow] = useState(true);

  const { activeWorkspace } = useUser();

  if (selectedGroup === "priority")
    groupTitle === "high"
      ? (bgColor = "#dc2626")
      : groupTitle === "medium"
      ? (bgColor = "#f97316")
      : groupTitle === "low"
      ? (bgColor = "#22c55e")
      : (bgColor = "#ff0000");

  const { data: people } = useSWR<IWorkspaceMember[]>(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  return (
    <Draggable draggableId={groupTitle} index={index}>
      {(provided, snapshot) => (
        <div
          className={`rounded flex-shrink-0 h-full ${
            snapshot.isDragging ? "border-theme shadow-lg" : ""
          } ${!show ? "" : "w-80 bg-gray-50 border"}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className={`${!show ? "" : "h-full space-y-3 overflow-y-auto flex flex-col"}`}>
            <div
              className={`flex justify-between p-3 pb-0 ${
                !show ? "flex-col bg-gray-50 rounded-md border" : ""
              }`}
            >
              <div className={`flex items-center ${!show ? "flex-col gap-2" : "gap-1"}`}>
                <button
                  type="button"
                  {...provided.dragHandleProps}
                  className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none ${
                    !show ? "" : "rotate-90"
                  } ${selectedGroup !== "state_detail.name" ? "hidden" : ""}`}
                >
                  <EllipsisHorizontalIcon className="h-4 w-4 text-gray-600" />
                  <EllipsisHorizontalIcon className="h-4 w-4 text-gray-600 mt-[-0.7rem]" />
                </button>
                <div
                  className={`flex items-center gap-x-1 px-2 bg-slate-900 rounded-md cursor-pointer ${
                    !show ? "py-2 mb-2 flex-col gap-y-2" : ""
                  }`}
                  style={{
                    border: `2px solid ${bgColor}`,
                    backgroundColor: `${bgColor}20`,
                  }}
                >
                  <h2
                    className={`text-[0.9rem] font-medium capitalize`}
                    style={{
                      writingMode: !show ? "vertical-rl" : "horizontal-tb",
                    }}
                  >
                    {groupTitle === null || groupTitle === "null"
                      ? "None"
                      : createdBy
                      ? createdBy
                      : addSpaceIfCamelCase(groupTitle)}
                  </h2>
                  <span className="text-gray-500 text-sm ml-0.5">
                    {groupedByIssues[groupTitle].length}
                  </span>
                </div>
              </div>

              <div className={`flex items-center ${!show ? "flex-col pb-2" : ""}`}>
                <button
                  type="button"
                  className="h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none"
                  onClick={() => {
                    setShow(!show);
                  }}
                >
                  {show ? (
                    <ArrowsPointingInIcon className="h-4 w-4" />
                  ) : (
                    <ArrowsPointingOutIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  className="h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none"
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
                  className={`mt-3 space-y-3 h-full overflow-y-auto px-3 pb-3 ${
                    snapshot.isDraggingOver ? "bg-indigo-50 bg-opacity-50" : ""
                  } ${!show ? "hidden" : "block"}`}
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
                    className="flex items-center text-xs font-medium hover:bg-gray-100 p-2 rounded duration-300 outline-none"
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
                    <PlusIcon className="h-3 w-3 mr-1" />
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
