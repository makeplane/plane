import React from "react";
// next
import Link from "next/link";
import Image from "next/image";
// swr
import useSWR from "swr";
// react-beautiful-dnd
import { DraggableStateSnapshot } from "react-beautiful-dnd";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// constants
import { PRIORITIES } from "constants/";
import { PROJECT_ISSUES_LIST, STATE_LIST } from "constants/fetch-keys";
import { getPriorityIcon } from "constants/global";
// services
import issuesService from "lib/services/issues.service";
import stateService from "lib/services/state.service";
// hooks
import useUser from "lib/hooks/useUser";
// icons
import { TrashIcon } from "@heroicons/react/24/outline";
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import User from "public/user.png";
// types
import { IIssue, IssueResponse, IWorkspaceMember, Properties } from "types";
// common
import {
  addSpaceIfCamelCase,
  classNames,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";

type Props = {
  issue: IIssue;
  properties: Properties;
  snapshot?: DraggableStateSnapshot;
  assignees: {
    avatar: string | undefined;
    first_name: string | undefined;
    email: string | undefined;
  }[];
  people: IWorkspaceMember[] | undefined;
  handleDeleteIssue?: React.Dispatch<React.SetStateAction<string | undefined>>;
  partialUpdateIssue: (formData: Partial<IIssue>, childIssueId: string) => void;
};

const SingleBoardIssue: React.FC<Props> = ({
  issue,
  properties,
  snapshot,
  assignees,
  people,
  handleDeleteIssue,
  partialUpdateIssue,
}) => {
  const { activeProject, activeWorkspace } = useUser();

  const { data: issues } = useSWR<IssueResponse>(
    activeWorkspace && activeProject
      ? PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id)
      : null,
    activeWorkspace && activeProject
      ? () => issuesService.getIssues(activeWorkspace.slug, activeProject.id)
      : null
  );

  const { data: states } = useSWR(
    activeWorkspace && activeProject ? STATE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => stateService.getStates(activeWorkspace.slug, activeProject.id)
      : null
  );

  const totalChildren = issues?.results.filter((i) => i.parent === issue.id).length;

  return (
    <div
      className={`rounded border bg-white shadow-sm ${
        snapshot && snapshot.isDragging ? "border-theme bg-indigo-50 shadow-lg" : ""
      }`}
    >
      <div className="group/card relative select-none p-2">
        {handleDeleteIssue && (
          <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover/card:opacity-100">
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded bg-white p-1 text-red-500 outline-none duration-300 hover:bg-red-50"
              onClick={() => handleDeleteIssue(issue.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        <Link href={`/projects/${issue.project}/issues/${issue.id}`}>
          <a>
            {properties.key && (
              <div className="mb-2 text-xs font-medium text-gray-500">
                {activeProject?.identifier}-{issue.sequence_id}
              </div>
            )}
            <h5
              className="mb-3 text-sm group-hover:text-theme"
              style={{ lineClamp: 3, WebkitLineClamp: 3 }}
            >
              {issue.name}
            </h5>
          </a>
        </Link>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
          {properties.priority && (
            <Listbox
              as="div"
              value={issue.priority}
              onChange={(data: string) => {
                partialUpdateIssue({ priority: data }, issue.id);
              }}
              className="group relative flex-shrink-0"
            >
              {({ open }) => (
                <>
                  <div>
                    <Listbox.Button
                      className={`grid cursor-pointer place-items-center rounded px-2 py-1 capitalize shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        issue.priority === "urgent"
                          ? "bg-red-100 text-red-600"
                          : issue.priority === "high"
                          ? "bg-orange-100 text-orange-500"
                          : issue.priority === "medium"
                          ? "bg-yellow-100 text-yellow-500"
                          : issue.priority === "low"
                          ? "bg-green-100 text-green-500"
                          : "bg-gray-100"
                      }`}
                    >
                      {getPriorityIcon(issue?.priority ?? "None")}
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={React.Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-20 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {PRIORITIES?.map((priority) => (
                          <Listbox.Option
                            key={priority}
                            className={({ active }) =>
                              classNames(
                                active ? "bg-indigo-50" : "bg-white",
                                "flex cursor-pointer select-none items-center gap-2 px-3 py-2 capitalize"
                              )
                            }
                            value={priority}
                          >
                            {getPriorityIcon(priority)}
                            {priority}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                  {/* <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                    <h5 className="font-medium mb-1 text-gray-900">Priority</h5>
                    <div
                      className={`capitalize ${
                        issue.priority === "urgent"
                          ? "text-red-600"
                          : issue.priority === "high"
                          ? "text-orange-500"
                          : issue.priority === "medium"
                          ? "text-yellow-500"
                          : issue.priority === "low"
                          ? "text-green-500"
                          : ""
                      }`}
                    >
                      {issue.priority ?? "None"}
                    </div>
                  </div> */}
                </>
              )}
            </Listbox>
          )}
          {properties.state && (
            <Listbox
              as="div"
              value={issue.state}
              onChange={(data: string) => {
                partialUpdateIssue({ state: data }, issue.id);
              }}
              className="group relative flex-shrink-0"
            >
              {({ open }) => (
                <>
                  <div>
                    <Listbox.Button className="flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <span
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: issue.state_detail.color,
                        }}
                      ></span>
                      {addSpaceIfCamelCase(issue.state_detail.name)}
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={React.Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-20 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {states?.map((state) => (
                          <Listbox.Option
                            key={state.id}
                            className={({ active }) =>
                              classNames(
                                active ? "bg-indigo-50" : "bg-white",
                                "flex cursor-pointer select-none items-center gap-2 px-3 py-2"
                              )
                            }
                            value={state.id}
                          >
                            <span
                              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                              style={{
                                backgroundColor: state.color,
                              }}
                            ></span>
                            {addSpaceIfCamelCase(state.name)}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                  {/* <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                    <h5 className="font-medium mb-1">State</h5>
                    <div>{issue.state_detail.name}</div>
                  </div> */}
                </>
              )}
            </Listbox>
          )}
          {properties.due_date && (
            <div
              className={`group flex flex-shrink-0 cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                issue.target_date === null
                  ? ""
                  : issue.target_date < new Date().toISOString()
                  ? "text-red-600"
                  : findHowManyDaysLeft(issue.target_date) <= 3 && "text-orange-400"
              }`}
            >
              <CalendarDaysIcon className="h-4 w-4" />
              {issue.target_date ? renderShortNumericDateFormat(issue.target_date) : "N/A"}
              {/* <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                <h5 className="font-medium mb-1 text-gray-900">Target date</h5>
                <div>{renderShortNumericDateFormat(issue.target_date ?? "")}</div>
                <div>
                  {issue.target_date &&
                    (issue.target_date < new Date().toISOString()
                      ? `Due date has passed by ${findHowManyDaysLeft(issue.target_date)} days`
                      : findHowManyDaysLeft(issue.target_date) <= 3
                      ? `Due date is in ${findHowManyDaysLeft(issue.target_date)} days`
                      : "Due date")}
                </div>
              </div> */}
            </div>
          )}
          {properties.children_count && (
            <div className="flex flex-shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {totalChildren} {totalChildren === 1 ? "sub-issue" : "sub-issues"}
            </div>
          )}
          {properties.assignee && (
            <Listbox
              as="div"
              value={issue.assignees}
              onChange={(data: any) => {
                const newData = issue.assignees ?? [];
                if (newData.includes(data)) {
                  newData.splice(newData.indexOf(data), 1);
                } else {
                  newData.push(data);
                }
                partialUpdateIssue({ assignees_list: newData }, issue.id);
              }}
              className="group relative flex-shrink-0"
            >
              {({ open }) => (
                <>
                  <div>
                    <Listbox.Button>
                      <div className="flex cursor-pointer items-center gap-1 text-xs">
                        {assignees.length > 0 ? (
                          assignees.map((assignee, index: number) => (
                            <div
                              key={index}
                              className={`relative z-[1] h-5 w-5 rounded-full ${
                                index !== 0 ? "-ml-2.5" : ""
                              }`}
                            >
                              {assignee.avatar && assignee.avatar !== "" ? (
                                <div className="h-5 w-5 rounded-full border-2 border-white bg-white">
                                  <Image
                                    src={assignee.avatar}
                                    height="100%"
                                    width="100%"
                                    className="rounded-full"
                                    alt={assignee?.first_name}
                                  />
                                </div>
                              ) : (
                                <div className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-gray-700 capitalize text-white">
                                  {assignee.first_name && assignee.first_name !== ""
                                    ? assignee.first_name.charAt(0)
                                    : assignee?.email?.charAt(0)}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-white bg-white">
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
                      <Listbox.Options className="absolute left-0 z-20 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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
                              {person.member.avatar && person.member.avatar !== "" ? (
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
                                <div className="grid h-4 w-4 place-items-center rounded-full bg-gray-700 capitalize text-white">
                                  {person.member.first_name && person.member.first_name !== ""
                                    ? person.member.first_name.charAt(0)
                                    : person.member.email.charAt(0)}
                                </div>
                              )}
                              <p>
                                {person.member.first_name && person.member.first_name !== ""
                                  ? person.member.first_name
                                  : person.member.email}
                              </p>
                            </div>
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                  {/* <div className="absolute bottom-full left-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                    <h5 className="font-medium mb-1">Assigned to</h5>
                    <div>
                      {issue.assignee_details?.length > 0
                        ? issue.assignee_details.map((assignee) => assignee.first_name).join(", ")
                        : "No one"}
                    </div>
                  </div> */}
                </>
              )}
            </Listbox>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleBoardIssue;
