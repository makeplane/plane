import { FC, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// services
import issuesService from "services/issues.service";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// components
import { ExistingIssuesListModal } from "components/core";
import { CreateUpdateIssueModal } from "components/issues";
// ui
import { CustomMenu } from "components/ui";
// icons
import { ChevronRightIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
// types
import { ICurrentUserResponse, IIssue, ISearchIssueResponse, ISubIssueResponse } from "types";
// fetch-keys
import { SUB_ISSUES } from "constants/fetch-keys";

type Props = {
  parentIssue: IIssue;
  user: ICurrentUserResponse | undefined;
  disabled?: boolean;
};

export const SubIssuesList: FC<Props> = ({ parentIssue, user, disabled = false }) => {
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [subIssuesListModal, setSubIssuesListModal] = useState(false);
  const [preloadedData, setPreloadedData] = useState<Partial<IIssue> | null>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { memberRole } = useProjectMyMembership();

  const { data: subIssuesResponse } = useSWR(
    workspaceSlug && parentIssue ? SUB_ISSUES(parentIssue.id) : null,
    workspaceSlug && parentIssue
      ? () => issuesService.subIssues(workspaceSlug as string, parentIssue.project, parentIssue.id)
      : null
  );

  const addAsSubIssue = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !parentIssue) return;

    const payload = {
      sub_issue_ids: data.map((i) => i.id),
    };

    await issuesService
      .addSubIssues(workspaceSlug as string, parentIssue.project, parentIssue.id, payload)
      .finally(() => mutate(SUB_ISSUES(parentIssue.id)));
  };

  const handleSubIssueRemove = (issue: IIssue) => {
    if (!workspaceSlug || !parentIssue) return;

    mutate<ISubIssueResponse>(
      SUB_ISSUES(parentIssue.id),
      (prevData) => {
        if (!prevData) return prevData;

        const stateDistribution = { ...prevData.state_distribution };

        const issueGroup = issue.state_detail.group;
        stateDistribution[issueGroup] = stateDistribution[issueGroup] - 1;

        return {
          state_distribution: stateDistribution,
          sub_issues: prevData.sub_issues.filter((i) => i.id !== issue.id),
        };
      },
      false
    );

    issuesService
      .patchIssue(workspaceSlug.toString(), issue.project, issue.id, { parent: null }, user)
      .finally(() => mutate(SUB_ISSUES(parentIssue.id)));
  };

  const handleCreateIssueModal = () => {
    setCreateIssueModal(true);

    setPreloadedData({
      parent: parentIssue.id,
    });
  };

  const completedSubIssues = subIssuesResponse
    ? subIssuesResponse.state_distribution.completed +
      subIssuesResponse.state_distribution.cancelled
    : 0;
  const totalSubIssues = subIssuesResponse ? subIssuesResponse.sub_issues.length : 0;

  const completionPercentage = (completedSubIssues / totalSubIssues) * 100;

  const isNotAllowed = memberRole.isGuest || memberRole.isViewer || disabled;

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={createIssueModal}
        prePopulateData={{ ...preloadedData }}
        handleClose={() => setCreateIssueModal(false)}
      />
      <ExistingIssuesListModal
        isOpen={subIssuesListModal}
        handleClose={() => setSubIssuesListModal(false)}
        searchParams={{ sub_issue: true, issue_id: parentIssue?.id }}
        handleOnSubmit={addAsSubIssue}
      />
      {subIssuesResponse && subIssuesResponse.sub_issues.length > 0 ? (
        <Disclosure defaultOpen={true}>
          {({ open }) => (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-start gap-3 text-custom-text-200">
                  <Disclosure.Button className="flex items-center gap-1 rounded px-2 py-1 text-xs text-custom-text-100 hover:bg-custom-background-80">
                    <ChevronRightIcon className={`h-3 w-3 ${open ? "rotate-90" : ""}`} />
                    Sub-issues{" "}
                    <span className="ml-1 text-custom-text-200">
                      {subIssuesResponse.sub_issues.length}
                    </span>
                  </Disclosure.Button>
                  <div className="flex w-60 items-center gap-2">
                    <div className="bar relative h-1.5 w-full rounded bg-custom-background-80">
                      <div
                        className="absolute top-0 left-0 h-1.5 rounded bg-green-500 duration-300"
                        style={{
                          width: `${
                            isNaN(completionPercentage)
                              ? 0
                              : completionPercentage > 100
                              ? 100
                              : completionPercentage.toFixed(0)
                          }%`,
                        }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-xs">
                      {isNaN(completionPercentage)
                        ? 0
                        : completionPercentage > 100
                        ? 100
                        : completionPercentage.toFixed(0)}
                      % Done
                    </span>
                  </div>
                </div>

                {open && !isNotAllowed ? (
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80"
                      onClick={handleCreateIssueModal}
                    >
                      <PlusIcon className="h-3 w-3" />
                      Create new
                    </button>

                    <CustomMenu ellipsis>
                      <CustomMenu.MenuItem onClick={() => setSubIssuesListModal(true)}>
                        Add an existing issue
                      </CustomMenu.MenuItem>
                    </CustomMenu>
                  </div>
                ) : null}
              </div>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel className="mt-3 flex flex-col gap-y-1">
                  {subIssuesResponse.sub_issues.map((issue) => (
                    <Link
                      key={issue.id}
                      href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
                    >
                      <a className="group flex items-center justify-between gap-2 rounded p-2 hover:bg-custom-background-90">
                        <div className="flex items-center gap-2 rounded text-xs">
                          <span
                            className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor: issue.state_detail.color,
                            }}
                          />
                          <span className="flex-shrink-0 text-custom-text-200">
                            {issue.project_detail.identifier}-{issue.sequence_id}
                          </span>
                          <span className="max-w-sm break-words font-medium">{issue.name}</span>
                        </div>

                        {!isNotAllowed && (
                          <button
                            type="button"
                            className="cursor-pointer opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSubIssueRemove(issue);
                            }}
                          >
                            <XMarkIcon className="h-4 w-4 text-custom-text-200 hover:text-custom-text-100" />
                          </button>
                        )}
                      </a>
                    </Link>
                  ))}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      ) : (
        !isNotAllowed && (
          <CustomMenu
            label={
              <>
                <PlusIcon className="h-3 w-3" />
                Add sub-issue
              </>
            }
            buttonClassName="whitespace-nowrap"
            position="left"
            noBorder
            noChevron
          >
            <CustomMenu.MenuItem onClick={handleCreateIssueModal}>Create new</CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={() => setSubIssuesListModal(true)}>
              Add an existing issue
            </CustomMenu.MenuItem>
          </CustomMenu>
        )
      )}
    </>
  );
};
