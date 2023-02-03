import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

// icons
import { Disclosure, Transition } from "@headlessui/react";
import { PlusIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
// services
import workspaceService from "services/workspace.service";
import stateService from "services/state.service";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
import useIssueView from "hooks/use-issue-view";
// components
import SingleListIssue from "components/core/list-view/single-issue";
// ui
import { CustomMenu, Spinner } from "components/ui";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue, IWorkspaceMember, UserAuth } from "types";
// fetch-keys
import { STATE_LIST, WORKSPACE_MEMBERS } from "constants/fetch-keys";

type Props = {
  issues: IIssue[];
  openCreateIssueModal: (issue?: IIssue, actionType?: "create" | "edit" | "delete") => void;
  openIssuesListModal: () => void;
  removeIssueFromModule: (issueId: string) => void;
  setPreloadedData: React.Dispatch<
    React.SetStateAction<
      | (Partial<IIssue> & {
          actionType: "createIssue" | "edit" | "delete";
        })
      | null
    >
  >;
  userAuth: UserAuth;
};

export const ModulesListView: React.FC<Props> = ({
  issues,
  openCreateIssueModal,
  openIssuesListModal,
  removeIssueFromModule,
  setPreloadedData,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, moduleId } = router.query;

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);
  const { issueView, groupedByIssues, groupByProperty: selectedGroup } = useIssueView(issues);

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

  if (issueView !== "list") return <></>;

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
                                typeId={moduleId as string}
                                issue={issue}
                                properties={properties}
                                editIssue={() => openCreateIssueModal(issue, "edit")}
                                removeIssue={() => removeIssueFromModule(issue.bridge ?? "")}
                                userAuth={userAuth}
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
