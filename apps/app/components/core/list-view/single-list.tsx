import { useRouter } from "next/router";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
// components
import { SingleListIssue } from "components/core";
// icons
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
// types
import { IIssue, IProjectMember, NestedKeyOf, UserAuth } from "types";
import { CustomMenu } from "components/ui";

type Props = {
  type?: "issue" | "cycle" | "module";
  groupTitle: string;
  groupedByIssues: {
    [key: string]: IIssue[];
  };
  selectedGroup: NestedKeyOf<IIssue> | null;
  members: IProjectMember[] | undefined;
  addIssueToState: () => void;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  openIssuesListModal?: (() => void) | null;
  removeIssue: ((bridgeId: string) => void) | null;
  userAuth: UserAuth;
};

export const SingleList: React.FC<Props> = ({
  type,
  groupTitle,
  groupedByIssues,
  selectedGroup,
  members,
  addIssueToState,
  handleEditIssue,
  handleDeleteIssue,
  openIssuesListModal,
  removeIssue,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const createdBy =
    selectedGroup === "created_by"
      ? members?.find((m) => m.member.id === groupTitle)?.member.first_name ?? "Loading..."
      : null;

  let assignees: any;
  if (selectedGroup === "assignees") {
    assignees = groupTitle.split(",");
    assignees = assignees
      .map((a: string) => members?.find((m) => m.member.id === a)?.member.first_name)
      .join(", ");
  }

  return (
    <Disclosure key={groupTitle} as="div" defaultOpen>
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
                    {selectedGroup === "created_by"
                      ? createdBy
                      : selectedGroup === "assignees"
                      ? assignees
                      : addSpaceIfCamelCase(groupTitle)}
                  </h2>
                ) : (
                  <h2 className="font-medium leading-5">All Issues</h2>
                )}
                <p className="text-sm text-gray-500">
                  {groupedByIssues[groupTitle as keyof IIssue].length}
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
                {groupedByIssues[groupTitle] ? (
                  groupedByIssues[groupTitle].length > 0 ? (
                    groupedByIssues[groupTitle].map((issue: IIssue) => (
                      <SingleListIssue
                        key={issue.id}
                        type={type}
                        issue={issue}
                        properties={properties}
                        editIssue={() => handleEditIssue(issue)}
                        handleDeleteIssue={handleDeleteIssue}
                        removeIssue={() => {
                          removeIssue && removeIssue(issue.bridge);
                        }}
                        userAuth={userAuth}
                      />
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-500">No issues.</p>
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center">Loading...</div>
                )}
              </div>
            </Disclosure.Panel>
          </Transition>
          <div className="p-3">
            {type === "issue" ? (
              <button
                type="button"
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-gray-100"
                onClick={addIssueToState}
              >
                <PlusIcon className="h-3 w-3" />
                Add issue
              </button>
            ) : (
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
                <CustomMenu.MenuItem onClick={addIssueToState}>Create new</CustomMenu.MenuItem>
                {openIssuesListModal && (
                  <CustomMenu.MenuItem onClick={openIssuesListModal}>
                    Add an existing issue
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            )}
          </div>
        </div>
      )}
    </Disclosure>
  );
};
