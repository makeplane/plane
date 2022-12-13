// react
import React, { useState } from "react";
// next
import Link from "next/link";
// swr
import useSWR, { mutate } from "swr";
// headless ui
import { Disclosure, Transition, Menu } from "@headlessui/react";
// services
import cycleServices from "lib/services/cycles.service";
// hooks
import useUser from "lib/hooks/useUser";
// components
import CycleIssuesListModal from "./CycleIssuesListModal";
// ui
import { Spinner } from "ui";
// icons
import { PlusIcon, EllipsisHorizontalIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
// types
import type { CycleViewProps as Props, CycleIssueResponse, IssueResponse } from "types";
// fetch keys
import { CYCLE_ISSUES } from "constants/fetch-keys";
// constants
import { renderShortNumericDateFormat } from "constants/common";
import issuesServices from "lib/services/issues.service";
import StrictModeDroppable from "components/dnd/StrictModeDroppable";
import { Draggable } from "react-beautiful-dnd";

const CycleView: React.FC<Props> = ({
  cycle,
  selectSprint,
  workspaceSlug,
  projectId,
  openIssueModal,
}) => {
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);

  const { activeWorkspace, activeProject, issues } = useUser();

  const { data: cycleIssues } = useSWR<CycleIssueResponse[]>(CYCLE_ISSUES(cycle.id), () =>
    cycleServices.getCycleIssues(workspaceSlug, projectId, cycle.id)
  );

  const removeIssueFromCycle = (cycleId: string, bridgeId: string) => {
    if (activeWorkspace && activeProject && cycleIssues) {
      mutate<CycleIssueResponse[]>(
        CYCLE_ISSUES(cycleId),
        (prevData) => prevData?.filter((p) => p.id !== bridgeId),
        false
      );

      issuesServices
        .removeIssueFromCycle(activeWorkspace.slug, activeProject.id, cycleId, bridgeId)
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  return (
    <>
      <CycleIssuesListModal
        isOpen={cycleIssuesListModal}
        handleClose={() => setCycleIssuesListModal(false)}
        issues={issues}
        cycleId={cycle.id}
      />
      <Disclosure as="div" defaultOpen>
        {({ open }) => (
          <div className="bg-white px-4 py-2 rounded-lg space-y-3">
            <div className="flex items-center">
              <Disclosure.Button className="w-full">
                <div className="flex items-center gap-x-2">
                  <span>
                    <ChevronDownIcon
                      width={22}
                      className={`text-gray-500 ${!open ? "transform -rotate-90" : ""}`}
                    />
                  </span>
                  <h2 className="font-medium leading-5">{cycle.name}</h2>
                  <p className="flex gap-2 text-xs text-gray-500">
                    <span>
                      {cycle.status === "started"
                        ? cycle.start_date
                          ? `${renderShortNumericDateFormat(cycle.start_date)} - `
                          : ""
                        : cycle.status}
                    </span>
                    <span>
                      {cycle.end_date ? renderShortNumericDateFormat(cycle.end_date) : ""}
                    </span>
                  </p>
                </div>
              </Disclosure.Button>

              <Menu as="div" className="relative inline-block">
                <Menu.Button className="grid place-items-center rounded p-1 hover:bg-gray-100 focus:outline-none">
                  <EllipsisHorizontalIcon className="h-4 w-4" />
                </Menu.Button>
                <Menu.Items className="absolute origin-top-right right-0 mt-1 p-1 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <Menu.Item>
                    <button
                      type="button"
                      className="text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full"
                      onClick={() => selectSprint({ ...cycle, actionType: "edit" })}
                    >
                      Edit
                    </button>
                  </Menu.Item>
                  <Menu.Item>
                    <button
                      type="button"
                      className="text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full"
                      onClick={() => selectSprint({ ...cycle, actionType: "delete" })}
                    >
                      Delete
                    </button>
                  </Menu.Item>
                </Menu.Items>
              </Menu>
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
                <StrictModeDroppable droppableId={cycle.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {cycleIssues ? (
                        cycleIssues.length > 0 ? (
                          cycleIssues.map((issue, index) => (
                            <Draggable
                              key={issue.id}
                              draggableId={`${issue.id},${issue.issue}`} // bridge id, issue id
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  className={`group p-2 hover:bg-gray-100 text-sm rounded flex items-center justify-between ${
                                    snapshot.isDragging
                                      ? "bg-gray-100 shadow-lg border border-theme"
                                      : ""
                                  }`}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                >
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 rotate-90 outline-none`}
                                      {...provided.dragHandleProps}
                                    >
                                      <EllipsisHorizontalIcon className="h-4 w-4 text-gray-600" />
                                      <EllipsisHorizontalIcon className="h-4 w-4 text-gray-600 mt-[-0.7rem]" />
                                    </button>
                                    <span
                                      className={`h-1.5 w-1.5 block rounded-full`}
                                      style={{
                                        backgroundColor: issue.issue_details.state_detail.color,
                                      }}
                                    />
                                    <Link
                                      href={`/projects/${projectId}/issues/${issue.issue_details.id}`}
                                    >
                                      <a className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                          {activeProject?.identifier}-
                                          {issue.issue_details.sequence_id}
                                        </span>
                                        {issue.issue_details.name}
                                        {/* {cycle.id} */}
                                      </a>
                                    </Link>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="text-black rounded-md px-2 py-0.5 text-sm"
                                      style={{
                                        backgroundColor: `${issue.issue_details.state_detail?.color}20`,
                                        border: `2px solid ${issue.issue_details.state_detail?.color}`,
                                      }}
                                    >
                                      {issue.issue_details.state_detail?.name}
                                    </span>
                                    <Menu as="div" className="relative">
                                      <Menu.Button
                                        as="button"
                                        className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-200 duration-300 outline-none`}
                                      >
                                        <EllipsisHorizontalIcon className="h-4 w-4" />
                                      </Menu.Button>
                                      <Menu.Items className="absolute origin-top-right right-0.5 mt-1 p-1 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                        <Menu.Item>
                                          <button
                                            className="text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full"
                                            type="button"
                                            onClick={() =>
                                              openIssueModal(cycle.id, issue.issue_details, "edit")
                                            }
                                          >
                                            Edit
                                          </button>
                                        </Menu.Item>
                                        <Menu.Item>
                                          <div className="hover:bg-gray-100 border-b last:border-0">
                                            <button
                                              className="text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full"
                                              type="button"
                                              onClick={() =>
                                                removeIssueFromCycle(issue.cycle, issue.id)
                                              }
                                            >
                                              Remove from cycle
                                            </button>
                                          </div>
                                        </Menu.Item>
                                        <Menu.Item>
                                          <div className="hover:bg-gray-100 border-b last:border-0">
                                            <button
                                              className="text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full"
                                              type="button"
                                              onClick={() =>
                                                openIssueModal(
                                                  cycle.id,
                                                  issue.issue_details,
                                                  "delete"
                                                )
                                              }
                                            >
                                              Delete permanently
                                            </button>
                                          </div>
                                        </Menu.Item>
                                      </Menu.Items>
                                    </Menu>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">This cycle has no issue.</p>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Spinner />
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </StrictModeDroppable>
              </Disclosure.Panel>
            </Transition>
            <Menu as="div" className="relative inline-block">
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
                <Menu.Items className="absolute left-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="p-1">
                    <Menu.Item as="div">
                      {(active) => (
                        <button
                          type="button"
                          className="text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full"
                          onClick={() => openIssueModal(cycle.id)}
                        >
                          Create new
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item as="div">
                      {(active) => (
                        <button
                          type="button"
                          className="p-2 text-left text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap"
                          onClick={() => setCycleIssuesListModal(true)}
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
        )}
      </Disclosure>
    </>
  );
};

export default CycleView;
