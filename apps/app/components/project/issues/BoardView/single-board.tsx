// react
import React, { useState } from "react";
// next
import Link from "next/link";
import Image from "next/image";
// swr
import useSWR from "swr";
// react-beautiful-dnd
import { Draggable } from "react-beautiful-dnd";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  CalendarDaysIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import User from "public/user.png";
// common
import { PRIORITIES } from "constants/";
import {
  addSpaceIfCamelCase,
  classNames,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
import { getPriorityIcon } from "constants/global";
// types
import { IIssue, Properties, NestedKeyOf, IWorkspaceMember } from "types";

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

  const { activeProject, activeWorkspace, states } = useUser();

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
                            className={`border rounded bg-white shadow-sm ${
                              snapshot.isDragging ? "border-theme shadow-lg bg-indigo-50" : ""
                            }`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <div
                              className="group/card relative p-2 select-none"
                              {...provided.dragHandleProps}
                            >
                              <div className="opacity-0 group-hover/card:opacity-100 absolute top-1 right-1">
                                <button
                                  type="button"
                                  className="h-7 w-7 p-1 grid place-items-center rounded text-red-500 hover:bg-red-50 duration-300 outline-none"
                                  onClick={() => handleDeleteIssue(childIssue.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                              <Link
                                href={`/projects/${childIssue.project}/issues/${childIssue.id}`}
                              >
                                <a>
                                  {properties.key && (
                                    <div className="text-xs font-medium text-gray-500 mb-2">
                                      {activeProject?.identifier}-{childIssue.sequence_id}
                                    </div>
                                  )}
                                  <h5
                                    className="group-hover:text-theme text-sm mb-3"
                                    style={{ lineClamp: 3, WebkitLineClamp: 3 }}
                                  >
                                    {childIssue.name}
                                  </h5>
                                </a>
                              </Link>
                              <div className="flex items-center gap-x-1 gap-y-2 text-xs flex-wrap">
                                {properties.priority && (
                                  <Listbox
                                    as="div"
                                    value={childIssue.priority}
                                    onChange={(data: string) => {
                                      partialUpdateIssue({ priority: data }, childIssue.id);
                                    }}
                                    className="group relative flex-shrink-0"
                                  >
                                    {({ open }) => (
                                      <>
                                        <div>
                                          <Listbox.Button
                                            className={`rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 capitalize ${
                                              childIssue.priority === "urgent"
                                                ? "bg-red-100 text-red-600"
                                                : childIssue.priority === "high"
                                                ? "bg-orange-100 text-orange-500"
                                                : childIssue.priority === "medium"
                                                ? "bg-yellow-100 text-yellow-500"
                                                : childIssue.priority === "low"
                                                ? "bg-green-100 text-green-500"
                                                : "bg-gray-100"
                                            }`}
                                          >
                                            {childIssue.priority ?? "None"}
                                          </Listbox.Button>

                                          <Transition
                                            show={open}
                                            as={React.Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                          >
                                            <Listbox.Options className="absolute z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                              {PRIORITIES?.map((priority) => (
                                                <Listbox.Option
                                                  key={priority}
                                                  className={({ active }) =>
                                                    classNames(
                                                      active ? "bg-indigo-50" : "bg-white",
                                                      "cursor-pointer capitalize select-none px-3 py-2"
                                                    )
                                                  }
                                                  value={priority}
                                                >
                                                  {priority}
                                                </Listbox.Option>
                                              ))}
                                            </Listbox.Options>
                                          </Transition>
                                        </div>
                                        <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                          <h5 className="font-medium mb-1 text-gray-900">
                                            Priority
                                          </h5>
                                          <div
                                            className={`capitalize ${
                                              childIssue.priority === "urgent"
                                                ? "text-red-600"
                                                : childIssue.priority === "high"
                                                ? "text-orange-500"
                                                : childIssue.priority === "medium"
                                                ? "text-yellow-500"
                                                : childIssue.priority === "low"
                                                ? "text-green-500"
                                                : ""
                                            }`}
                                          >
                                            {childIssue.priority ?? "None"}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </Listbox>
                                )}
                                {properties.state && (
                                  <Listbox
                                    as="div"
                                    value={childIssue.state}
                                    onChange={(data: string) => {
                                      partialUpdateIssue({ state: data }, childIssue.id);
                                    }}
                                    className="group relative flex-shrink-0"
                                  >
                                    {({ open }) => (
                                      <>
                                        <div>
                                          <Listbox.Button className="flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                                            <span
                                              className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
                                              style={{
                                                backgroundColor: childIssue.state_detail.color,
                                              }}
                                            ></span>
                                            {addSpaceIfCamelCase(childIssue.state_detail.name)}
                                          </Listbox.Button>

                                          <Transition
                                            show={open}
                                            as={React.Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                          >
                                            <Listbox.Options className="absolute z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                              {states?.map((state) => (
                                                <Listbox.Option
                                                  key={state.id}
                                                  className={({ active }) =>
                                                    classNames(
                                                      active ? "bg-indigo-50" : "bg-white",
                                                      "cursor-pointer select-none px-3 py-2"
                                                    )
                                                  }
                                                  value={state.id}
                                                >
                                                  {addSpaceIfCamelCase(state.name)}
                                                </Listbox.Option>
                                              ))}
                                            </Listbox.Options>
                                          </Transition>
                                        </div>
                                        <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                          <h5 className="font-medium mb-1">State</h5>
                                          <div>{childIssue.state_detail.name}</div>
                                        </div>
                                      </>
                                    )}
                                  </Listbox>
                                )}
                                {properties.start_date && (
                                  <div className="group flex-shrink-0 flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                                    <CalendarDaysIcon className="h-4 w-4" />
                                    {childIssue.start_date
                                      ? renderShortNumericDateFormat(childIssue.start_date)
                                      : "N/A"}
                                    <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                      <h5 className="font-medium mb-1">Started at</h5>
                                      <div>
                                        {renderShortNumericDateFormat(childIssue.start_date ?? "")}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {properties.target_date && (
                                  <div
                                    className={`group flex-shrink-0 group flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 ${
                                      childIssue.target_date === null
                                        ? ""
                                        : childIssue.target_date < new Date().toISOString()
                                        ? "text-red-600"
                                        : findHowManyDaysLeft(childIssue.target_date) <= 3 &&
                                          "text-orange-400"
                                    }`}
                                  >
                                    <CalendarDaysIcon className="h-4 w-4" />
                                    {childIssue.target_date
                                      ? renderShortNumericDateFormat(childIssue.target_date)
                                      : "N/A"}
                                    <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                      <h5 className="font-medium mb-1 text-gray-900">
                                        Target date
                                      </h5>
                                      <div>
                                        {renderShortNumericDateFormat(childIssue.target_date ?? "")}
                                      </div>
                                      <div>
                                        {childIssue.target_date &&
                                          (childIssue.target_date < new Date().toISOString()
                                            ? `Target date has passed by ${findHowManyDaysLeft(
                                                childIssue.target_date
                                              )} days`
                                            : findHowManyDaysLeft(childIssue.target_date) <= 3
                                            ? `Target date is in ${findHowManyDaysLeft(
                                                childIssue.target_date
                                              )} days`
                                            : "Target date")}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {properties.assignee && (
                                  <Listbox
                                    as="div"
                                    value={childIssue.assignees}
                                    onChange={(data: any) => {
                                      const newData = childIssue.assignees ?? [];
                                      if (newData.includes(data)) {
                                        newData.splice(newData.indexOf(data), 1);
                                      } else {
                                        newData.push(data);
                                      }
                                      partialUpdateIssue(
                                        { assignees_list: newData },
                                        childIssue.id
                                      );
                                    }}
                                    className="group relative flex-shrink-0"
                                  >
                                    {({ open }) => (
                                      <>
                                        <div>
                                          <Listbox.Button>
                                            <div className="flex items-center gap-1 text-xs cursor-pointer">
                                              {assignees.length > 0 ? (
                                                assignees.map((assignee, index: number) => (
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
                                                          height="100%"
                                                          width="100%"
                                                          className="rounded-full"
                                                          alt={assignee?.first_name}
                                                        />
                                                      </div>
                                                    ) : (
                                                      <div
                                                        className={`h-5 w-5 bg-gray-700 text-white border-2 border-white grid place-items-center rounded-full`}
                                                      >
                                                        {assignee.first_name?.charAt(0)}
                                                      </div>
                                                    )}
                                                  </div>
                                                ))
                                              ) : (
                                                <div className="h-5 w-5 border-2 bg-white border-white rounded-full">
                                                  <Image
                                                    src={User}
                                                    height="100%"
                                                    width="100%"
                                                    className="rounded-full"
                                                    alt="No user"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </Listbox.Button>

                                          <Transition
                                            show={open}
                                            as={React.Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                          >
                                            <Listbox.Options className="absolute left-0 z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                                              {people?.map((person) => (
                                                <Listbox.Option
                                                  key={person.id}
                                                  className={({ active }) =>
                                                    classNames(
                                                      active ? "bg-indigo-50" : "bg-white",
                                                      "cursor-pointer select-none p-2"
                                                    )
                                                  }
                                                  value={person.member.id}
                                                >
                                                  <div
                                                    className={`flex items-center gap-x-1 ${
                                                      assignees.includes({
                                                        avatar: person.member.avatar,
                                                        first_name: person.member.first_name,
                                                        email: person.member.email,
                                                      })
                                                        ? "font-medium"
                                                        : "font-normal"
                                                    }`}
                                                  >
                                                    {person.member.avatar &&
                                                    person.member.avatar !== "" ? (
                                                      <div className="relative h-4 w-4">
                                                        <Image
                                                          src={person.member.avatar}
                                                          alt="avatar"
                                                          className="rounded-full"
                                                          layout="fill"
                                                          objectFit="cover"
                                                        />
                                                      </div>
                                                    ) : (
                                                      <div className="h-4 w-4 bg-gray-700 text-white grid place-items-center capitalize rounded-full">
                                                        {person.member.first_name &&
                                                        person.member.first_name !== ""
                                                          ? person.member.first_name.charAt(0)
                                                          : person.member.email.charAt(0)}
                                                      </div>
                                                    )}
                                                    <p>
                                                      {person.member.first_name &&
                                                      person.member.first_name !== ""
                                                        ? person.member.first_name
                                                        : person.member.email}
                                                    </p>
                                                  </div>
                                                </Listbox.Option>
                                              ))}
                                            </Listbox.Options>
                                          </Transition>
                                        </div>
                                        <div className="absolute bottom-full left-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                          <h5 className="font-medium mb-1">Assigned to</h5>
                                          <div>
                                            {childIssue.assignee_details?.length > 0
                                              ? childIssue.assignee_details
                                                  .map((assignee) => assignee.first_name)
                                                  .join(", ")
                                              : "No one"}
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </Listbox>
                                )}
                              </div>
                            </div>
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
