import React, { useState } from "react";
// Next imports
import Link from "next/link";
// React beautiful dnd
import { Draggable } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// common
import { addSpaceIfCamelCase, renderShortNumericDateFormat } from "constants/common";
// types
import { IIssue, Properties, NestedKeyOf } from "types";
// icons
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  CalendarDaysIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { divide } from "lodash";

type Props = {
  selectedGroup: NestedKeyOf<IIssue> | null;
  groupTitle: string;
  groupedByIssues: any;
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
  stateId?: string;
  createdBy?: string;
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
}) => {
  // Collapse/Expand
  const [show, setState] = useState<any>(true);

  if (selectedGroup === "priority")
    groupTitle === "high"
      ? (bgColor = "#dc2626")
      : groupTitle === "medium"
      ? (bgColor = "#f97316")
      : groupTitle === "low"
      ? (bgColor = "#22c55e")
      : (bgColor = "#ff0000");

  return (
    <Draggable draggableId={groupTitle} index={index}>
      {(provided, snapshot) => (
        <div
          className={`rounded flex-shrink-0 h-full ${
            snapshot.isDragging ? "border-indigo-600 shadow-lg" : ""
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
                  <span
                    className={`w-3 h-3 block rounded-full ${!show ? "" : "mr-1"}`}
                    style={{
                      backgroundColor: bgColor,
                    }}
                  />
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
                    setState(!show);
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
                        state: stateId,
                        [selectedGroup]: groupTitle,
                        actionType: "createIssue",
                      });
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none"
                  onClick={() =>
                    setPreloadedData({
                      // ...state,
                      actionType: "edit",
                    })
                  }
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                {/* <button
                  type="button"
                  className="h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300"
                  onClick={() =>
                    setSelectedState({
                      ...state,
                      actionType: "delete",
                    })
                  }
                >
                  <TrashIcon className="h-4 w-4 text-red-500" />
                </button> */}
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
                  {groupedByIssues[groupTitle].map((childIssue: any, index: number) => (
                    <Draggable key={childIssue.id} draggableId={childIssue.id} index={index}>
                      {(provided, snapshot) => (
                        <Link
                          href={`/projects/${childIssue.project}/issues/${childIssue.id}`}
                          className={`group block border rounded bg-white shadow-sm ${
                            snapshot.isDragging ? "border-indigo-600 shadow-lg bg-indigo-50" : ""
                          }`}
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <div
                            className="px-2 py-3 space-y-1.5 select-none"
                            {...provided.dragHandleProps}
                          >
                            {Object.keys(properties).map(
                              (key) =>
                                properties[key as keyof Properties] &&
                                !Array.isArray(childIssue[key as keyof IIssue]) && (
                                  <div
                                    key={key}
                                    className={`${
                                      key === "name"
                                        ? "text-sm mb-2"
                                        : key === "description"
                                        ? "text-xs text-black"
                                        : key === "priority"
                                        ? `text-xs bg-gray-200 px-2 py-1 mt-2 flex items-center gap-x-1 rounded w-min whitespace-nowrap capitalize font-medium ${
                                            childIssue.priority === "high"
                                              ? "bg-red-100 text-red-600"
                                              : childIssue.priority === "medium"
                                              ? "bg-orange-100 text-orange-500"
                                              : childIssue.priority === "low"
                                              ? "bg-green-100 text-green-500"
                                              : "hidden"
                                          }`
                                        : key === "target_date"
                                        ? "text-xs bg-indigo-50 px-2 py-1 mt-2 flex items-center gap-x-1 rounded w-min whitespace-nowrap"
                                        : "text-sm text-gray-500"
                                    } gap-1
                                    `}
                                  >
                                    {key === "target_date" ? (
                                      <>
                                        <CalendarDaysIcon className="h-4 w-4" />{" "}
                                        {childIssue.target_date
                                          ? renderShortNumericDateFormat(childIssue.target_date)
                                          : "N/A"}
                                      </>
                                    ) : (
                                      ""
                                    )}
                                    {key === "name" && (
                                      <span className="group-hover:text-theme">
                                        {childIssue.name}
                                      </span>
                                    )}
                                    {key === "state" && (
                                      <>{addSpaceIfCamelCase(childIssue["state_detail"].name)}</>
                                    )}
                                    {key === "priority" && <>{childIssue.priority}</>}
                                    {key === "description" && <>{childIssue.description}</>}
                                    {key === "assignee" ? (
                                      <div className="flex items-center gap-1 text-xs">
                                        {childIssue?.assignee_details?.length > 0 ? (
                                          childIssue?.assignee_details?.map(
                                            (assignee: any, index: number) => (
                                              <div
                                                key={index}
                                                className={`relative z-[1] h-5 w-5 rounded-full ${
                                                  index !== 0 ? "-ml-2.5" : ""
                                                }`}
                                              >
                                                {assignee.avatar && assignee.avatar !== "" ? (
                                                  <div className="h-5 w-5 border-2 bg-white border-white rounded-full">
                                                    <Image
                                                      src={assignee.avatar}
                                                      height="100"
                                                      width="100"
                                                      className="rounded-full"
                                                      alt={assignee.name}
                                                    />
                                                  </div>
                                                ) : (
                                                  <div
                                                    className={`h-5 w-5 bg-gray-700 text-white border-2 border-white grid place-items-center rounded-full`}
                                                  >
                                                    {assignee.first_name.charAt(0)}
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          )
                                        ) : (
                                          <span>None</span>
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                )
                            )}
                          </div>

                          {/* <div
                          className={`p-2 bg-indigo-50 flex items-center justify-between ${
                            snapshot.isDragging ? "bg-indigo-200" : ""
                          }`}
                        >
                          <button
                            type="button"
                            className="flex flex-col"
                            {...provided.dragHandleProps}
                          >
                            <EllipsisHorizontalIcon className="h-4 w-4 text-gray-600" />
                            <EllipsisHorizontalIcon className="h-4 w-4 text-gray-600 mt-[-0.7rem]" />
                          </button>
                          <div className="flex gap-1 items-center">
                            <button type="button">
                              <HeartIcon className="h-4 w-4 text-yellow-500" />
                            </button>
                            <button type="button">
                              <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            </button>
                          </div>
                        </div> */}
                        </Link>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <button
                    type="button"
                    className="flex items-center text-xs font-medium hover:bg-gray-200 p-2 rounded duration-300 outline-none"
                    onClick={() => {
                      setIsIssueOpen(true);
                      if (selectedGroup !== null) {
                        setPreloadedData({
                          state: stateId,
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
