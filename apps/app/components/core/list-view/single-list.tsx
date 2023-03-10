import { useRouter } from "next/router";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
// components
import { SingleListIssue } from "components/core";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { getStateGroupIcon } from "components/icons";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue, IProjectMember, IState, NestedKeyOf, UserAuth } from "types";
import { CustomMenu } from "components/ui";

type Props = {
  type?: "issue" | "cycle" | "module";
  currentState?: IState | null;
  bgColor?: string;
  groupTitle: string;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  selectedGroup: NestedKeyOf<IIssue> | null;
  members: IProjectMember[] | undefined;
  addIssueToState: () => void;
  makeIssueCopy: (issue: IIssue) => void;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  removeIssue: ((bridgeId: string) => void) | null;
  userAuth: UserAuth;
};

export const SingleList: React.FC<Props> = ({
  type,
  currentState,
  bgColor,
  groupTitle,
  groupedByIssues,
  selectedGroup,
  members,
  addIssueToState,
  makeIssueCopy,
  handleEditIssue,
  handleDeleteIssue,
  openIssuesListModal,
  removeIssue,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const createdBy =
    selectedGroup === "created_by"
      ? members?.find((m) => m.member.id === groupTitle)?.member.first_name ?? "Loading..."
      : null;

  let assignees: any;
  if (selectedGroup === "assignees") {
    assignees = groupTitle && groupTitle !== "" ? groupTitle.split(",") : [];
    assignees =
      assignees.length > 0
        ? assignees
            .map((a: string) => members?.find((m) => m.member.id === a)?.member.first_name)
            .join(", ")
        : "No assignee";
  }

  return (
    <Disclosure key={groupTitle} as="div" defaultOpen>
      {({ open }) => (
        <div className="rounded-[10px] border border-gray-300 bg-white">
          <div
            className={`flex items-center justify-between bg-gray-100 px-5 py-3 ${
              open ? "rounded-t-[10px]" : "rounded-[10px]"
            }`}
          >
            <Disclosure.Button>
              <div className="flex items-center gap-x-3">
                {selectedGroup !== null && selectedGroup === "state_detail.name" ? (
                  <span>
                    {currentState && getStateGroupIcon(currentState.group, "20", "20", bgColor)}
                  </span>
                ) : (
                  ""
                )}
                {selectedGroup !== null ? (
                  <h2 className="text-xl font-semibold capitalize leading-6 text-gray-800">
                    {selectedGroup === "created_by"
                      ? createdBy
                      : selectedGroup === "assignees"
                      ? assignees
                      : addSpaceIfCamelCase(groupTitle)}
                  </h2>
                ) : (
                  <h2 className="font-medium leading-5">All Issues</h2>
                )}
                <span className="rounded-full bg-gray-200 py-0.5 px-3 text-sm text-black">
                  {groupedByIssues[groupTitle as keyof IIssue].length}
                </span>
              </div>
            </Disclosure.Button>
            {type === "issue" ? (
              <button
                type="button"
                className="p-1  text-gray-500 hover:bg-gray-100"
                onClick={addIssueToState}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            ) : (
              <CustomMenu
                label={
                  <span className="flex items-center">
                    <PlusIcon className="h-4 w-4" />
                  </span>
                }
                optionsPosition="left"
                noBorder
              >
                <CustomMenu.MenuItem onClick={addIssueToState}>Create new</CustomMenu.MenuItem>
                {openIssuesListModal && (
                  <CustomMenu.MenuItem onClick={openIssuesListModal}>
                    Add an existing issue
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            )}
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
              {groupedByIssues[groupTitle] ? (
                groupedByIssues[groupTitle].length > 0 ? (
                  groupedByIssues[groupTitle].map((item: any) => {
                    let issue: IIssue;
                    if (cycleId || moduleId)
                      issue = {
                        ...item.issue_detail,
                        sub_issues_count: item.sub_issues_count,
                        bridge: item.id,
                        cycle: cycleId as string,
                        module: moduleId as string,
                      };
                    else issue = item;

                    return (
                      <SingleListIssue
                        key={issue.id}
                        type={type}
                        issue={issue}
                        properties={properties}
                        editIssue={() => handleEditIssue(issue)}
                        makeIssueCopy={() => makeIssueCopy(issue)}
                        handleDeleteIssue={handleDeleteIssue}
                        removeIssue={() => {
                          removeIssue && removeIssue(issue.bridge);
                        }}
                        userAuth={userAuth}
                      />
                    );
                  })
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500">No issues.</p>
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center">Loading...</div>
              )}
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );
};
