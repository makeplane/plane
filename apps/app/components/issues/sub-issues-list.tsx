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
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import { ICurrentUserResponse, IIssue, ISearchIssueResponse, ISubIssueResponse } from "types";
// fetch-keys
import { PROJECT_ISSUES_LIST, SUB_ISSUES } from "constants/fetch-keys";

type Props = {
  parentIssue: IIssue;
  user: ICurrentUserResponse | undefined;
};

export const SubIssuesList: FC<Props> = ({ parentIssue, user }) => {
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const [subIssuesListModal, setSubIssuesListModal] = useState(false);
  const [preloadedData, setPreloadedData] = useState<Partial<IIssue> | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { memberRole } = useProjectMyMembership();

  const { data: subIssuesResponse } = useSWR<ISubIssueResponse>(
    workspaceSlug && projectId && issueId ? SUB_ISSUES(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          issuesService.subIssues(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const { data: issues } = useSWR(
    workspaceSlug && projectId
      ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string)
      : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssues(workspaceSlug as string, projectId as string)
      : null
  );

  const addAsSubIssue = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId) return;

    const payload = {
      sub_issue_ids: data.map((i) => i.id),
    };

    await issuesService
      .addSubIssues(workspaceSlug as string, projectId as string, parentIssue?.id ?? "", payload)
      .then(() => {
        mutate<ISubIssueResponse>(
          SUB_ISSUES(parentIssue?.id ?? ""),
          (prevData) => {
            if (!prevData) return prevData;
            let newSubIssues = prevData.sub_issues as IIssue[];

            const stateDistribution = { ...prevData.state_distribution };

            payload.sub_issue_ids.forEach((issueId: string) => {
              const issue = issues?.find((i) => i.id === issueId);

              if (issue) {
                newSubIssues.push(issue);

                const issueGroup = issue.state_detail.group;
                stateDistribution[issueGroup] = stateDistribution[issueGroup] + 1;
              }
            });

            newSubIssues = orderArrayBy(newSubIssues, "created_at", "descending");
            return {
              state_distribution: stateDistribution,
              sub_issues: newSubIssues,
            };
          },
          false
        );

        mutate<IIssue[]>(
          PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
          (prevData) =>
            (prevData ?? []).map((p) => {
              if (payload.sub_issue_ids.includes(p.id))
                return {
                  ...p,
                  parent: parentIssue.id,
                };

              return p;
            }),
          false
        );

        mutate(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSubIssueRemove = (issueId: string) => {
    if (!workspaceSlug || !projectId) return;

    mutate<ISubIssueResponse>(
      SUB_ISSUES(parentIssue.id ?? ""),
      (prevData) => {
        if (!prevData) return prevData;
        const updatedArray = (prevData.sub_issues ?? []).filter((i) => i.id !== issueId);

        const stateDistribution = { ...prevData.state_distribution };
        const issueGroup = issues?.find((i) => i.id === issueId)?.state_detail.group ?? "backlog";
        stateDistribution[issueGroup] = stateDistribution[issueGroup] - 1;
        return {
          state_distribution: stateDistribution,
          sub_issues: updatedArray,
        };
      },
      false
    );

    issuesService
      .patchIssue(workspaceSlug.toString(), projectId.toString(), issueId, { parent: null }, user)
      .then((res) => {
        mutate(SUB_ISSUES(parentIssue.id ?? ""));

        mutate<IIssue[]>(
          PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
          (prevData) =>
            (prevData ?? []).map((p) => {
              if (p.id === res.id)
                return {
                  ...p,
                  ...res,
                };

              return p;
            }),
          false
        );
      })
      .catch((e) => {
        console.error(e);
      });
  };

  const handleCreateIssueModal = () => {
    setCreateIssueModal(true);
    setPreloadedData({
      parent: parentIssue.id,
    });
  };

  const completedSubIssues = subIssuesResponse
    ? subIssuesResponse?.state_distribution.completed +
      subIssuesResponse?.state_distribution.cancelled
    : 0;

  const totalSubIssues =
    subIssuesResponse && subIssuesResponse.sub_issues ? subIssuesResponse?.sub_issues.length : 0;

  const completionPercentage = (completedSubIssues / totalSubIssues) * 100;

  const isNotAllowed = memberRole.isGuest || memberRole.isViewer;

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
      {subIssuesResponse &&
      subIssuesResponse.sub_issues &&
      subIssuesResponse.sub_issues.length > 0 ? (
        <Disclosure defaultOpen={true}>
          {({ open }) => (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-start gap-3">
                  <Disclosure.Button className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-brand-surface-1">
                    <ChevronRightIcon className={`h-3 w-3 ${open ? "rotate-90" : ""}`} />
                    Sub-issues{" "}
                    <span className="ml-1 text-brand-secondary">
                      {subIssuesResponse.sub_issues.length}
                    </span>
                  </Disclosure.Button>
                  {subIssuesResponse.state_distribution && (
                    <div className="flex w-60 items-center gap-2 text-brand-base">
                      <div className="bar relative h-1.5 w-full rounded bg-brand-surface-2">
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
                  )}
                </div>

                {open && !isNotAllowed ? (
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-brand-surface-1"
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
                      href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
                    >
                      <a className="group flex items-center justify-between gap-2 rounded p-2 hover:bg-brand-base">
                        <div className="flex items-center gap-2 rounded text-xs">
                          <span
                            className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            style={{
                              backgroundColor: issue.state_detail.color,
                            }}
                          />
                          <span className="flex-shrink-0 text-brand-secondary">
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
                              handleSubIssueRemove(issue.id);
                            }}
                          >
                            <XMarkIcon className="h-4 w-4 text-brand-secondary hover:text-brand-base" />
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
