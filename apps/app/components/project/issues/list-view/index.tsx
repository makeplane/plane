import React, { useState } from "react";
// next
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// headless ui
import { Disclosure, Listbox, Transition } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
// services
import workspaceService from "lib/services/workspace.service";
import issuesService from "lib/services/issues.service";
import stateService from "lib/services/state.service";
// constants
import {
  addSpaceIfCamelCase,
  classNames,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";
import { PRIORITIES } from "constants/";
import { getPriorityIcon } from "constants/global";
import { PROJECT_ISSUES_LIST, STATE_LIST, WORKSPACE_MEMBERS } from "constants/fetch-keys";
// ui
import { CustomMenu, Spinner } from "ui";
// icons
import User from "public/user.png";
import { ChevronDownIcon, PlusIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
// components
import CreateUpdateIssuesModal from "components/project/issues/create-update-issue-modal";
// types
import { IIssue, IssueResponse, IWorkspaceMember, NestedKeyOf, Properties } from "types";

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
  
  const router = useRouter();

  const {
    query: { workspaceSlug },
  } = router;

  const { activeWorkspace, activeProject } = useUser();

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
              <div className="rounded-lg bg-white">
                <div className="rounded-t-lg bg-gray-100 px-4 py-3">
                  <Disclosure.Button>
                    <div className="flex items-center gap-x-2">
                      <span>
                        <ChevronDownIcon
                          className={`h-4 w-4 text-gray-500 ${!open ? "-rotate-90 transform" : ""}`}
                        />
                      </span>
                      {selectedGroup !== null ? (
                        <h2 className="font-medium capitalize leading-5">
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
                      <p className="text-sm text-gray-500">
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

                            const totalChildren = issues?.results.filter(
                              (i) => i.parent === issue.id
                            ).length;

                            return (
                              <div
                                key={issue.id}
                                className="flex items-center justify-between gap-2 rounded px-4 py-3 text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full`}
                                    style={{
                                      backgroundColor: issue.state_detail.color,
                                    }}
                                  />
                                  <Link href={`/${workspaceSlug}/projects/${activeProject?.id}/issues/${issue.id}`}>
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
                                <div className="flex flex-shrink-0 flex-wrap items-center gap-x-1 gap-y-2 text-xs">
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
                                              className={`flex cursor-pointer items-center gap-x-2 rounded px-2 py-1 capitalize shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
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
                                              {getPriorityIcon(
                                                issue.priority && issue.priority !== ""
                                                  ? issue.priority ?? ""
                                                  : "None",
                                                "text-sm"
                                              )}
                                              {issue.priority && issue.priority !== ""
                                                ? issue.priority
                                                : null}
                                            </Listbox.Button>

                                            <Transition
                                              show={open}
                                              as={React.Fragment}
                                              leave="transition ease-in duration-100"
                                              leaveFrom="opacity-100"
                                              leaveTo="opacity-0"
                                            >
                                              <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-48 w-36 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                {PRIORITIES?.map((priority) => (
                                                  <Listbox.Option
                                                    key={priority}
                                                    className={({ active }) =>
                                                      classNames(
                                                        active ? "bg-indigo-50" : "bg-white",
                                                        "flex cursor-pointer select-none items-center gap-x-2 px-3 py-2 capitalize"
                                                      )
                                                    }
                                                    value={priority}
                                                  >
                                                    {getPriorityIcon(priority, "text-sm")}
                                                    {priority}
                                                  </Listbox.Option>
                                                ))}
                                              </Listbox.Options>
                                            </Transition>
                                          </div>
                                          <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                            <h5 className="mb-1 font-medium text-gray-900">
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
                                              <Listbox.Options className="absolute z-10 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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
                                          <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                            <h5 className="mb-1 font-medium">State</h5>
                                            <div>{issue.state_detail.name}</div>
                                          </div>
                                        </>
                                      )}
                                    </Listbox>
                                  )}
                                  {properties.due_date && (
                                    <div
                                      className={`group group relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
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
                                      <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                        <h5 className="mb-1 font-medium text-gray-900">
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
                                  {properties.children_count && (
                                    <div className="flex flex-shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                      {totalChildren} {totalChildren === 1 ? "child" : "children"}
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
                                                        <div
                                                          className={`grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-gray-700 text-white`}
                                                        >
                                                          {assignee.first_name?.charAt(0)}
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
                                              <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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
                                                        <div className="grid h-4 w-4 place-items-center rounded-full bg-gray-700 capitalize text-white">
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
                                          <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                            <h5 className="mb-1 font-medium">Assigned to</h5>
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
                          <p className="px-4 py-3 text-sm text-gray-500">No issues.</p>
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Spinner />
                        </div>
                      )}
                    </div>
                  </Disclosure.Panel>
                </Transition>
                <div className="p-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-gray-100"
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
