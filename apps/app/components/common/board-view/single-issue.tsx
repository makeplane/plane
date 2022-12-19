// next
import Link from "next/link";
import Image from "next/image";
// react-beautiful-dnd
import { DraggableStateSnapshot } from "react-beautiful-dnd";
// headless ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { TrashIcon } from "@heroicons/react/24/outline";
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import User from "public/user.png";
// types
import { IIssue, IWorkspaceMember, Properties } from "types";
// common
import {
  addSpaceIfCamelCase,
  classNames,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";
// constants
import { PRIORITIES } from "constants/";
import useUser from "lib/hooks/useUser";
import React from "react";

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

const SingleIssue: React.FC<Props> = ({
  issue,
  properties,
  snapshot,
  assignees,
  people,
  handleDeleteIssue,
  partialUpdateIssue,
}) => {
  const { activeProject, states } = useUser();

  return (
    <div
      className={`border rounded bg-white shadow-sm ${
        snapshot && snapshot.isDragging ? "border-theme shadow-lg bg-indigo-50" : ""
      }`}
    >
      <div className="group/card relative p-2 select-none">
        {handleDeleteIssue && (
          <div className="opacity-0 group-hover/card:opacity-100 absolute top-1 right-1 z-10">
            <button
              type="button"
              className="h-7 w-7 p-1 grid place-items-center rounded text-red-500 bg-white hover:bg-red-50 duration-300 outline-none"
              onClick={() => handleDeleteIssue(issue.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        <Link href={`/projects/${issue.project}/issues/${issue.id}`}>
          <a>
            {properties.key && (
              <div className="text-xs font-medium text-gray-500 mb-2">
                {activeProject?.identifier}-{issue.sequence_id}
              </div>
            )}
            <h5
              className="group-hover:text-theme text-sm mb-3"
              style={{ lineClamp: 3, WebkitLineClamp: 3 }}
            >
              {issue.name}
            </h5>
          </a>
        </Link>
        <div className="flex items-center gap-x-1 gap-y-2 text-xs flex-wrap">
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
                      className={`rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 capitalize ${
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
                      {issue.priority ?? "None"}
                    </Listbox.Button>

                    <Transition
                      show={open}
                      as={React.Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-20 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
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
                  </div>
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
                    <Listbox.Button className="flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                      <span
                        className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
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
                      <Listbox.Options className="absolute z-20 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                        {states?.map((state) => (
                          <Listbox.Option
                            key={state.id}
                            className={({ active }) =>
                              classNames(
                                active ? "bg-indigo-50" : "bg-white",
                                "flex items-center gap-2 cursor-pointer select-none px-3 py-2"
                              )
                            }
                            value={state.id}
                          >
                            <span
                              className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
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
                  <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                    <h5 className="font-medium mb-1">State</h5>
                    <div>{issue.state_detail.name}</div>
                  </div>
                </>
              )}
            </Listbox>
          )}
          {properties.start_date && (
            <div className="group flex-shrink-0 flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
              <CalendarDaysIcon className="h-4 w-4" />
              {issue.start_date ? renderShortNumericDateFormat(issue.start_date) : "N/A"}
              <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                <h5 className="font-medium mb-1">Started at</h5>
                <div>{renderShortNumericDateFormat(issue.start_date ?? "")}</div>
              </div>
            </div>
          )}
          {properties.target_date && (
            <div
              className={`group flex-shrink-0 group flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 ${
                issue.target_date === null
                  ? ""
                  : issue.target_date < new Date().toISOString()
                  ? "text-red-600"
                  : findHowManyDaysLeft(issue.target_date) <= 3 && "text-orange-400"
              }`}
            >
              <CalendarDaysIcon className="h-4 w-4" />
              {issue.target_date ? renderShortNumericDateFormat(issue.target_date) : "N/A"}
              <div className="fixed -translate-y-3/4 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                <h5 className="font-medium mb-1 text-gray-900">Target date</h5>
                <div>{renderShortNumericDateFormat(issue.target_date ?? "")}</div>
                <div>
                  {issue.target_date &&
                    (issue.target_date < new Date().toISOString()
                      ? `Target date has passed by ${findHowManyDaysLeft(issue.target_date)} days`
                      : findHowManyDaysLeft(issue.target_date) <= 3
                      ? `Target date is in ${findHowManyDaysLeft(issue.target_date)} days`
                      : "Target date")}
                </div>
              </div>
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
                                <div className="h-5 w-5 bg-gray-700 text-white border-2 border-white grid place-items-center rounded-full capitalize">
                                  {assignee.first_name && assignee.first_name !== ""
                                    ? assignee.first_name.charAt(0)
                                    : assignee?.email?.charAt(0)}
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
                      <Listbox.Options className="absolute left-0 z-20 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
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
                                <div className="h-4 w-4 bg-gray-700 text-white grid place-items-center capitalize rounded-full">
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
                  <div className="absolute bottom-full left-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                    <h5 className="font-medium mb-1">Assigned to</h5>
                    <div>
                      {issue.assignee_details?.length > 0
                        ? issue.assignee_details.map((assignee) => assignee.first_name).join(", ")
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
  );
};

export default SingleIssue;
