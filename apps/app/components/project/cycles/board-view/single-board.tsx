// react
import React, { useState } from "react";
// swr
import useSWR from "swr";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
// components
import SingleIssue from "components/project/common/board-view/single-issue";
// headless ui
import { Menu, Transition } from "@headlessui/react";
// ui
import { CustomMenu } from "ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssue, IWorkspaceMember, NestedKeyOf, Properties } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS } from "constants/fetch-keys";
// common
import { addSpaceIfCamelCase, classNames } from "constants/common";

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
  partialUpdateIssue: (formData: Partial<IIssue>, issueId: string) => void;
  handleDeleteIssue: React.Dispatch<React.SetStateAction<string | undefined>>;
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
  partialUpdateIssue,
  handleDeleteIssue,
}) => {
  // Collapse/Expand
  const [show, setState] = useState(true);

  const { activeWorkspace } = useUser();

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
              <SingleIssue
                key={childIssue.id}
                issue={childIssue}
                properties={properties}
                assignees={assignees}
                people={people}
                partialUpdateIssue={partialUpdateIssue}
                handleDeleteIssue={handleDeleteIssue}
              />
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
