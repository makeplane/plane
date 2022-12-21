// react
import React, { useState } from "react";
// next
import Link from "next/link";
import Image from "next/image";
// swr
import useSWR from "swr";
// headless ui
import { Disclosure, Listbox, Menu, Transition } from "@headlessui/react";
// ui
import { CustomMenu, Spinner } from "ui";
// icons
import {
  ChevronDownIcon,
  PlusIcon,
  CalendarDaysIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import User from "public/user.png";
// components
import CreateUpdateIssuesModal from "components/project/issues/create-update-issue-modal";
// types
import { IIssue, IWorkspaceMember, NestedKeyOf, Properties } from "types";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
// fetch keys
import { PRIORITIES } from "constants/";
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
// constants
import {
  addSpaceIfCamelCase,
  classNames,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";

// types
type Props = {
  properties: Properties;
  groupedByIssues: any;
  selectedGroup: NestedKeyOf<IIssue> | null;
  setSelectedIssue: any;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  partialUpdateIssue: (formData: Partial<IIssue>, issueId: string) => void;
};

const ListView: React.FC<Props> = ({
  properties,
  groupedByIssues,
  selectedGroup,
  setSelectedIssue,
  handleDeleteIssue,
  partialUpdateIssue,
}) => {
  const [isCreateIssuesModalOpen, setIsCreateIssuesModalOpen] = useState(false);
  const [preloadedData, setPreloadedData] = useState<
    (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
  >(undefined);

  const { activeWorkspace, activeProject, states } = useUser();

  const { data: people } = useSWR<IWorkspaceMember[]>(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  return (
    <>
      <CreateUpdateIssuesModal
        isOpen={isCreateIssuesModalOpen && preloadedData?.actionType === "createIssue"}
        setIsOpen={setIsCreateIssuesModalOpen}
        prePopulateData={{
          ...preloadedData,
        }}
        projectId={activeProject?.id as string}
      />
      <div className="flex flex-col space-y-5">
        {Object.keys(groupedByIssues).map((singleGroup) => (
          <Disclosure key={singleGroup} as="div" defaultOpen>
            {({ open }) => (
              <div className="bg-white rounded-lg">
                <div className="bg-gray-100 px-4 py-3 rounded-t-lg">
                  <Disclosure.Button>
                    <div className="flex items-center gap-x-2">
                      <span>
                        <ChevronDownIcon
                          className={`h-4 w-4 text-gray-500 ${!open ? "transform -rotate-90" : ""}`}
                        />
                      </span>
                      {selectedGroup !== null ? (
                        <h2 className="font-medium leading-5 capitalize">
                          {singleGroup === null || singleGroup === "null"
                            ? selectedGroup === "priority" && "No priority"
                            : selectedGroup === "created_by"
                            ? people?.find((p) => p.member.id === singleGroup)?.member
                                ?.first_name ?? "Loading..."
                            : addSpaceIfCamelCase(singleGroup)}
                        </h2>
                      ) : (
                        <h2 className="font-medium leading-5">All Issues</h2>
                      )}
                      <p className="text-gray-500 text-sm">
                        {groupedByIssues[singleGroup as keyof IIssue].length}
                      </p>
                    </div>
                  </Disclosure.Button>
                </div>
                <Transition
                  show={open}
                  enter="transition duration-100 ease-out"
                  enterFrom="transform opacity-0"
                  enterTo="transform opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform opacity-100"
                  leaveTo="transform opacity-0"
                >
                  <Disclosure.Panel>
                    <div className="divide-y-2">
                      {groupedByIssues[singleGroup] ? (
                        groupedByIssues[singleGroup].length > 0 ? (
                          groupedByIssues[singleGroup].map((issue: IIssue) => {
                            const assignees = [
                              ...(issue?.assignees_list ?? []),
                              ...(issue?.assignees ?? []),
                            ]?.map((assignee) => {
                              const tempPerson = people?.find(
                                (p) => p.member.id === assignee
                              )?.member;

                              return {
                                avatar: tempPerson?.avatar,
                                first_name: tempPerson?.first_name,
                                email: tempPerson?.email,
                              };
                            });

                            return (
                              <div
                                key={issue.id}
                                className="px-4 py-3 text-sm rounded flex justify-between items-center gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`flex-shrink-0 h-1.5 w-1.5 block rounded-full`}
                                    style={{
                                      backgroundColor: issue.state_detail.color,
                                    }}
                                  />
                                  <Link href={`/projects/${activeProject?.id}/issues/${issue.id}`}>
                                    <a className="group relative flex items-center gap-2">
                                      {properties.key && (
                                        <span className="flex-shrink-0 text-xs text-gray-500">
                                          {activeProject?.identifier}-{issue.sequence_id}
                                        </span>
                                      )}
                                      <span>{issue.name}</span>
                                      {/* <div className="absolute bottom-full left-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md max-w-sm whitespace-nowrap">
                                        <h5 className="font-medium mb-1">Name</h5>
                                        <div>{issue.name}</div>
                                      </div> */}
                                    </a>
                                  </Link>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-x-1 gap-y-2 text-xs flex-wrap">
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
                                            <div>{issue.state_detail.name}</div>
                                          </div>
                                        </>
                                      )}
                                    </Listbox>
                                  )}
                                  {properties.start_date && (
                                    <div className="group relative flex-shrink-0 flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                                      <CalendarDaysIcon className="h-4 w-4" />
                                      {issue.start_date
                                        ? renderShortNumericDateFormat(issue.start_date)
                                        : "N/A"}
                                      <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                        <h5 className="font-medium mb-1">Started at</h5>
                                        <div>
                                          {renderShortNumericDateFormat(issue.start_date ?? "")}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {properties.due_date && (
                                    <div
                                      className={`group relative flex-shrink-0 group flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300 ${
                                        issue.target_date === null
                                          ? ""
                                          : issue.target_date < new Date().toISOString()
                                          ? "text-red-600"
                                          : findHowManyDaysLeft(issue.target_date) <= 3 &&
                                            "text-orange-400"
                                      }`}
                                    >
                                      <CalendarDaysIcon className="h-4 w-4" />
                                      {issue.target_date
                                        ? renderShortNumericDateFormat(issue.target_date)
                                        : "N/A"}
                                      <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                        <h5 className="font-medium mb-1 text-gray-900">
                                          Target date
                                        </h5>
                                        <div>
                                          {renderShortNumericDateFormat(issue.target_date ?? "")}
                                        </div>
                                        <div>
                                          {issue.target_date &&
                                            (issue.target_date < new Date().toISOString()
                                              ? `Due date has passed by ${findHowManyDaysLeft(
                                                  issue.target_date
                                                )} days`
                                              : findHowManyDaysLeft(issue.target_date) <= 3
                                              ? `Due date is in ${findHowManyDaysLeft(
                                                  issue.target_date
                                                )} days`
                                              : "Due date")}
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
                                              <Listbox.Options className="absolute right-0 z-10 mt-1 bg-white shadow-lg max-h-28 rounded-md py-1 text-xs ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
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
                                          <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                            <h5 className="font-medium mb-1">Assigned to</h5>
                                            <div>
                                              {issue.assignee_details?.length > 0
                                                ? issue.assignee_details
                                                    .map((assignee) => assignee.first_name)
                                                    .join(", ")
                                                : "No one"}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </Listbox>
                                  )}
                                  <CustomMenu ellipsis>
                                    <CustomMenu.MenuItem
                                      onClick={() => {
                                        setSelectedIssue({
                                          ...issue,
                                          actionType: "edit",
                                        });
                                      }}
                                    >
                                      Edit
                                    </CustomMenu.MenuItem>
                                    <CustomMenu.MenuItem
                                      onClick={() => {
                                        handleDeleteIssue(issue.id);
                                      }}
                                    >
                                      Delete permanently
                                    </CustomMenu.MenuItem>
                                  </CustomMenu>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-sm px-4 py-3 text-gray-500">No issues.</p>
                        )
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Spinner />
                        </div>
                      )}
                    </div>
                  </Disclosure.Panel>
                </Transition>
                <div className="p-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-xs font-medium"
                    onClick={() => {
                      setIsCreateIssuesModalOpen(true);
                      if (selectedGroup !== null) {
                        const stateId =
                          selectedGroup === "state_detail.name"
                            ? states?.find((s) => s.name === singleGroup)?.id ?? null
                            : null;
                        setPreloadedData({
                          state: stateId !== null ? stateId : undefined,
                          [selectedGroup]: singleGroup,
                          actionType: "createIssue",
                        });
                      } else {
                        setPreloadedData({
                          actionType: "createIssue",
                        });
                      }
                    }}
                  >
                    <PlusIcon className="h-3 w-3" />
                    Add issue
                  </button>
                </div>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </>
  );
};

export default ListView;
