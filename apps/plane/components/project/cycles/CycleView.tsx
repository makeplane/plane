import React from "react";
// next
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// headless ui
import { Disclosure, Transition, Menu, Listbox } from "@headlessui/react";
// fetch keys
import { PROJECT_ISSUES_LIST, CYCLE_ISSUES } from "constants/fetch-keys";
// services
import issuesServices from "lib/services/issues.services";
import cycleServices from "lib/services/cycles.services";
// commons
import { classNames, renderShortNumericDateFormat } from "constants/common";
// ui
import { Spinner } from "ui";
// icons
import { PlusIcon, EllipsisHorizontalIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
// types
import type { ICycle, SprintViewProps as Props, SprintIssueResponse, IssueResponse } from "types";

const SprintView: React.FC<Props> = ({
  sprint,
  selectSprint,
  workspaceSlug,
  projectId,
  openIssueModal,
  addIssueToSprint,
}) => {
  const router = useRouter();

  const { data: sprintIssues } = useSWR<SprintIssueResponse[]>(CYCLE_ISSUES(sprint.id), () =>
    cycleServices.getCycleIssues(workspaceSlug, projectId, sprint.id)
  );

  const { data: projectIssues } = useSWR<IssueResponse>(
    projectId && workspaceSlug ? PROJECT_ISSUES_LIST(workspaceSlug, projectId) : null,
    workspaceSlug ? () => issuesServices.getIssues(workspaceSlug, projectId) : null
  );

  return (
    <div className="w-full flex flex-col gap-y-4 pb-5 relative">
      <Disclosure defaultOpen>
        {({ open }) => (
          <div className="bg-gray-50 py-5 px-5 rounded">
            <div className="w-full h-full space-y-6 overflow-auto pb-10">
              <div className="w-full flex items-center">
                <Disclosure.Button className="w-full">
                  <div className="flex items-center gap-x-2">
                    <span>
                      <ChevronDownIcon
                        width={22}
                        className={`text-gray-500 ${!open ? "transform -rotate-90" : ""}`}
                      />
                    </span>
                    <h2 className="text-xl">{sprint.name}</h2>
                    <p className="font-light text-gray-500">
                      {sprint.status === "started"
                        ? sprint.start_date
                          ? `${renderShortNumericDateFormat(sprint.start_date)} - `
                          : ""
                        : sprint.status}
                      {sprint.end_date ? renderShortNumericDateFormat(sprint.end_date) : ""}
                    </p>
                  </div>
                </Disclosure.Button>

                <div className="relative">
                  <Menu>
                    <Menu.Button>
                      <EllipsisHorizontalIcon width="16" height="16" />
                    </Menu.Button>
                    <Menu.Items className="absolute z-20 w-28 bg-white rounded border cursor-pointer -left-24">
                      <Menu.Item>
                        <div className="hover:bg-gray-100 border-b last:border-0">
                          <button
                            className="w-full text-left py-2 pl-2"
                            type="button"
                            onClick={() => selectSprint({ ...sprint, actionType: "edit" })}
                          >
                            Edit
                          </button>
                        </div>
                      </Menu.Item>
                      <Menu.Item>
                        <div className="hover:bg-gray-100 border-b last:border-0">
                          <button
                            className="w-full text-left py-2 pl-2"
                            type="button"
                            onClick={() => selectSprint({ ...sprint, actionType: "delete" })}
                          >
                            Delete
                          </button>
                        </div>
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>
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
                  <div className="space-y-3">
                    {sprintIssues ? (
                      sprintIssues.length > 0 ? (
                        sprintIssues.map((issue) => (
                          <div
                            key={issue.id}
                            className="p-4 bg-white border border-gray-200 rounded flex items-center justify-between"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/projects/${projectId}/issues/${issue.issue_details.id}`
                                )
                              }
                            >
                              <p>{issue.issue_details.name}</p>
                            </button>
                            <div className="flex items-center gap-x-4">
                              <span
                                className="text-black rounded px-2 py-0.5 text-sm border"
                                style={{
                                  backgroundColor: `${issue.issue_details.state_detail?.color}20`,
                                  borderColor: issue.issue_details.state_detail?.color,
                                }}
                              >
                                {issue.issue_details.state_detail?.name}
                              </span>
                              <div className="relative">
                                <Menu>
                                  <Menu.Button>
                                    <EllipsisHorizontalIcon width="16" height="16" />
                                  </Menu.Button>
                                  <Menu.Items className="absolute z-20 w-28 bg-white rounded border cursor-pointer -left-24">
                                    <Menu.Item>
                                      <div className="hover:bg-gray-100 border-b last:border-0">
                                        <button
                                          className="w-full text-left py-2 pl-2"
                                          type="button"
                                          onClick={() =>
                                            openIssueModal(sprint.id, issue.issue_details, "edit")
                                          }
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    </Menu.Item>
                                    <Menu.Item>
                                      <div className="hover:bg-gray-100 border-b last:border-0">
                                        <button
                                          className="w-full text-left py-2 pl-2"
                                          type="button"
                                          onClick={() =>
                                            openIssueModal(sprint.id, issue.issue_details, "delete")
                                          }
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </Menu.Item>
                                  </Menu.Items>
                                </Menu>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">This sprint has no issues.</p>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </Disclosure.Panel>
              </Transition>
              <div className="flex flex-col gap-y-2">
                <button
                  className="text-indigo-600 flex items-center gap-x-2"
                  onClick={() => openIssueModal(sprint.id)}
                >
                  <div className="bg-theme text-white rounded-full p-0.5">
                    <PlusIcon width="18" height="18" />
                  </div>
                  <p>Add Issue</p>
                </button>

                <div className="ml-1">
                  <Menu as="div" className="inline-block text-left">
                    <div>
                      <Menu.Button className="inline-flex w-full items-center justify-center rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100">
                        <div className="text-indigo-600 flex items-center gap-x-2">
                          <p>Add Existing Issue</p>
                        </div>
                        <ChevronDownIcon
                          className="-mr-1 ml-2 h-5 w-5 text-indigo-600"
                          aria-hidden="true"
                        />
                      </Menu.Button>
                    </div>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute left-5 z-20 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          {projectIssues?.results.map((issue) => (
                            <Menu.Item
                              key={issue.id}
                              as="div"
                              onClick={() => {
                                addIssueToSprint(sprint.id, issue.id);
                              }}
                            >
                              {({ active }) => (
                                <p
                                  className={classNames(
                                    active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                                    "block px-4 py-2 text-sm"
                                  )}
                                >
                                  {issue.name}
                                </p>
                              )}
                            </Menu.Item>
                          ))}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          </div>
        )}
      </Disclosure>
    </div>
  );
};

export default SprintView;
