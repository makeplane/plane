// react
import React from "react";
// next
import Link from "next/link";
// swr
import useSWR from "swr";
// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { CustomMenu, Spinner } from "ui";
// icons
import { PlusIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IWorkspaceMember, NestedKeyOf, Properties } from "types";
// fetch keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
// constants
import {
  addSpaceIfCamelCase,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
} from "constants/common";
import workspaceService from "lib/services/workspace.service";

type Props = {
  groupedByIssues: {
    [key: string]: (IIssue & { bridge?: string })[];
  };
  properties: Properties;
  selectedGroup: NestedKeyOf<IIssue> | null;
  openCreateIssueModal: (issue?: IIssue, actionType?: "create" | "edit" | "delete") => void;
  openIssuesListModal: () => void;
  removeIssueFromModule: (issueId: string) => void;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
  setPreloadedData: React.Dispatch<
    React.SetStateAction<
      | (Partial<IIssue> & {
          actionType: "createIssue" | "edit" | "delete";
        })
      | undefined
    >
  >;
};

const ModulesListView: React.FC<Props> = ({
  groupedByIssues,
  selectedGroup,
  openCreateIssueModal,
  openIssuesListModal,
  properties,
  removeIssueFromModule,
  handleDeleteIssue,
  setPreloadedData,
}) => {
  const { activeWorkspace, activeProject, states } = useUser();

  const { data: people } = useSWR<IWorkspaceMember[]>(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  return (
    <div className="flex flex-col space-y-5">
      {Object.keys(groupedByIssues).map((singleGroup) => {
        const stateId =
          selectedGroup === "state_detail.name"
            ? states?.find((s) => s.name === singleGroup)?.id ?? null
            : null;

        return (
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
                          groupedByIssues[singleGroup].map((issue) => {
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
                                    <div
                                      className={`group relative flex-shrink-0 flex items-center gap-1 text-xs rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 capitalize ${
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
                                      {/* {getPriorityIcon(issue.priority ?? "")} */}
                                      {issue.priority ?? "None"}
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
                                    </div>
                                  )}
                                  {properties.state && (
                                    <div className="group relative flex-shrink-0 flex items-center gap-1 hover:bg-gray-100 border rounded shadow-sm px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs duration-300">
                                      <span
                                        className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
                                        style={{
                                          backgroundColor: issue?.state_detail?.color,
                                        }}
                                      ></span>
                                      {addSpaceIfCamelCase(issue?.state_detail.name)}
                                      <div className="absolute bottom-full right-0 mb-2 z-10 hidden group-hover:block p-2 bg-white shadow-md rounded-md whitespace-nowrap">
                                        <h5 className="font-medium mb-1">State</h5>
                                        <div>{issue?.state_detail.name}</div>
                                      </div>
                                    </div>
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
                                        <h5 className="font-medium mb-1 text-gray-900">Due date</h5>
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
                                  <CustomMenu width="auto" ellipsis>
                                    <CustomMenu.MenuItem
                                      onClick={() => openCreateIssueModal(issue, "edit")}
                                    >
                                      Edit
                                    </CustomMenu.MenuItem>
                                    <CustomMenu.MenuItem
                                      onClick={() => removeIssueFromModule(issue.bridge ?? "")}
                                    >
                                      Remove from module
                                    </CustomMenu.MenuItem>
                                    <CustomMenu.MenuItem
                                      onClick={() => handleDeleteIssue(issue.id)}
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
                  <CustomMenu
                    label={
                      <span className="flex items-center gap-1">
                        <PlusIcon className="h-3 w-3" />
                        Add issue
                      </span>
                    }
                    optionsPosition="left"
                    withoutBorder
                  >
                    <CustomMenu.MenuItem
                      onClick={() => {
                        openCreateIssueModal();
                        if (selectedGroup !== null) {
                          setPreloadedData({
                            state: stateId !== null ? stateId : undefined,
                            [selectedGroup]: singleGroup,
                            actionType: "createIssue",
                          });
                        }
                      }}
                    >
                      Create new
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem onClick={() => openIssuesListModal()}>
                      Add an existing issue
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
            )}
          </Disclosure>
        );
      })}
    </div>
  );
};

export default ModulesListView;
