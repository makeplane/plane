import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";
// services
import workspaceService from "lib/services/workspace.service";
import stateService from "lib/services/state.service";
// common
import { addSpaceIfCamelCase } from "constants/common";

// components
import SingleListIssue from "components/common/list-view/single-issue";
// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { CustomMenu, Spinner } from "ui";
// icons
import { PlusIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
// types
import { IIssue, IWorkspaceMember, NestedKeyOf, Properties } from "types";
// fetch-keys
import { STATE_LIST, WORKSPACE_MEMBERS } from "constants/fetch-keys";

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
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: people } = useSWR<IWorkspaceMember[]>(
    workspaceSlug ? WORKSPACE_MEMBERS : null,
    workspaceSlug ? () => workspaceService.workspaceMembers(workspaceSlug as string) : null
  );

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <div className="flex h-full flex-col space-y-5">
      {Object.keys(groupedByIssues).map((singleGroup) => {
        const stateId =
          selectedGroup === "state_detail.name"
            ? states?.find((s) => s.name === singleGroup)?.id ?? null
            : null;

        return (
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
                              <SingleListIssue
                                key={issue.id}
                                type="module"
                                issue={issue}
                                properties={properties}
                                editIssue={() => openCreateIssueModal(issue, "edit")}
                                handleDeleteIssue={() => handleDeleteIssue(issue.id)}
                                removeIssue={() => removeIssueFromModule(issue.bridge ?? "")}
                              />
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
                  <CustomMenu
                    label={
                      <span className="flex items-center gap-1">
                        <PlusIcon className="h-3 w-3" />
                        Add issue
                      </span>
                    }
                    optionsPosition="left"
                    noBorder
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
