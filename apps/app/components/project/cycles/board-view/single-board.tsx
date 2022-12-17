// react
import React, { useState } from "react";
// next
import Link from "next/link";
import Image from "next/image";
// swr
import useSWR from "swr";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { CustomMenu } from "ui";
// icons
import { CalendarDaysIcon, PlusIcon } from "@heroicons/react/24/outline";
import User from "public/user.png";
// types
import { IIssue, IWorkspaceMember, NestedKeyOf, Properties } from "types";
// constants
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
import {
  addSpaceIfCamelCase,
  classNames,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";
import workspaceService from "lib/services/workspace.service";
import { Menu, Transition } from "@headlessui/react";

type Props = {
  properties: Properties;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  selectedGroup: NestedKeyOf<IIssue> | null;
  groupTitle: string;
  createdBy: string | null;
  bgColor?: string;
  openCreateIssueModal: (issue?: IIssue, actionType?: "create" | "edit" | "delete") => void;
  openIssuesListModal: () => void;
  removeIssueFromCycle: (bridgeId: string) => void;
};

const SingleCycleBoard: React.FC<Props> = ({
  properties,
  groupedByIssues,
  selectedGroup,
  groupTitle,
  createdBy,
  bgColor,
  openCreateIssueModal,
  openIssuesListModal,
  removeIssueFromCycle,
}) => {
  // Collapse/Expand
  const [show, setState] = useState(true);

  const { activeWorkspace, activeProject } = useUser();

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
    <div className={`rounded flex-shrink-0 h-full ${!show ? "" : "w-80 bg-gray-50 border"}`}>
      <div className={`${!show ? "" : "h-full space-y-3 overflow-y-auto flex flex-col"}`}>
        <div
          className={`flex justify-between p-3 pb-0 ${
            !show ? "flex-col bg-gray-50 rounded-md border" : ""
          }`}
        >
          <div
            className={`w-full flex justify-between items-center ${
              !show ? "flex-col gap-2" : "gap-1"
            }`}
          >
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

            <CustomMenu width="auto" ellipsis>
              <CustomMenu.MenuItem onClick={() => openCreateIssueModal()}>
                Create new
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => openIssuesListModal()}>
                Add an existing issue
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
        </div>
        <div
          className={`mt-3 space-y-3 h-full overflow-y-auto px-3 pb-3 ${
            !show ? "hidden" : "block"
          }`}
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
              <div key={childIssue.id} className={`border rounded bg-white shadow-sm`}>
                <div className="relative p-2 select-none">
                  <Link href={`/projects/${childIssue.project}/issues/${childIssue.id}`}>
                    <a>
                      {properties.key && (
                        <div className="text-xs font-medium text-gray-500 mb-2">
                          {activeProject?.identifier}-{childIssue.sequence_id}
                        </div>
                      )}
                      <h5
                        className="group-hover:text-theme text-sm break-all mb-3"
                        style={{ lineClamp: 3, WebkitLineClamp: 3 }}
                      >
                        {childIssue.name}
                      </h5>
                    </a>
                  </Link>
                  <div className="flex items-center gap-x-1 gap-y-2 text-xs flex-wrap">
                    {properties.priority && (
                      <div
                        className={`group flex-shrink-0 flex items-center gap-1 rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 capitalize ${
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
                        {/* {getPriorityIcon(childIssue.priority ?? "")} */}
                        {childIssue.priority ?? "None"}
                        <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                          <h5 className="font-medium mb-1 text-gray-900">Priority</h5>
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
                      </div>
                    )}
                    {properties.state && (
                      <div className="group flex-shrink-0 flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                        <span
                          className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: childIssue.state_detail.color }}
                        ></span>
                        {addSpaceIfCamelCase(childIssue.state_detail.name)}
                        <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                          <h5 className="font-medium mb-1">State</h5>
                          <div>{childIssue.state_detail.name}</div>
                        </div>
                      </div>
                    )}
                    {properties.start_date && (
                      <div className="group flex-shrink-0 flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {childIssue.start_date
                          ? renderShortNumericDateFormat(childIssue.start_date)
                          : "N/A"}
                        <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                          <h5 className="font-medium mb-1">Started at</h5>
                          <div>{renderShortNumericDateFormat(childIssue.start_date ?? "")}</div>
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
                            : findHowManyDaysLeft(childIssue.target_date) <= 3 && "text-orange-400"
                        }`}
                      >
                        <CalendarDaysIcon className="h-4 w-4" />
                        {childIssue.target_date
                          ? renderShortNumericDateFormat(childIssue.target_date)
                          : "N/A"}
                        <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                          <h5 className="font-medium mb-1 text-gray-900">Target date</h5>
                          <div>{renderShortNumericDateFormat(childIssue.target_date ?? "")}</div>
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
                      <div className="group flex items-center gap-1 text-xs">
                        {childIssue.assignee_details?.length > 0 ? (
                          childIssue.assignee_details?.map((assignee, index: number) => (
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
                        <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                          <h5 className="font-medium mb-1">Assigned to</h5>
                          <div>
                            {childIssue.assignee_details?.length > 0
                              ? childIssue.assignee_details
                                  .map((assignee) => assignee.first_name)
                                  .join(", ")
                              : "No one"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <Menu as="div" className="relative text-left">
            <Menu.Button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-xs font-medium">
              <PlusIcon className="h-3 w-3" />
              Add issue
            </Menu.Button>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute left-0 z-10 mt-1 rounded-md bg-white text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none whitespace-nowrap">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        className={classNames(
                          active ? "bg-indigo-50 text-gray-900" : "text-gray-700",
                          "block w-full p-2 text-left"
                        )}
                        onClick={() => openCreateIssueModal()}
                      >
                        Create new
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        className={classNames(
                          active ? "bg-indigo-50 text-gray-900" : "text-gray-700",
                          "block w-full p-2 text-left"
                        )}
                        onClick={() => openIssuesListModal()}
                      >
                        Add an existing issue
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default SingleCycleBoard;
