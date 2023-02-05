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
  userAuth: UserAuth;
};

export const SingleList: React.FC<Props> = ({
  type = "issue",
  groupTitle,
  groupedByIssues,
  selectedGroup,
  members,
  addIssueToState,
  handleEditIssue,
  handleDeleteIssue,
  openIssuesListModal,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const createdBy =
    selectedGroup === "created_by"
      ? members?.find((m) => m.member.id === groupTitle)?.member.first_name ?? "loading..."
      : null;

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
                    {groupTitle === null || groupTitle === "null"
                      ? "None"
                      : createdBy
                      ? createdBy
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
                    groupedByIssues[groupTitle].map((issue: IIssue) => {
                      const assignees = [
                        ...(issue?.assignees_list ?? []),
                        ...(issue?.assignees ?? []),
                      ]?.map((assignee) => {
                        const tempPerson = members?.find((p) => p.member.id === assignee)?.member;

                        return tempPerson;
                      });

                      return (
                        <SingleListIssue
                          key={issue.id}
                          type="issue"
                          issue={issue}
                          properties={properties}
                          editIssue={() => handleEditIssue(issue)}
                          handleDeleteIssue={handleDeleteIssue}
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
            ) : null}
          </div>
        </div>
      )}
    </Disclosure>
  );
};
