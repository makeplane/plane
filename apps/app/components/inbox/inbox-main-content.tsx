import { useCallback, useEffect } from "react";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react hook form
import { Control, UseFormReset, UseFormWatch } from "react-hook-form";
// services
import issuesService from "services/issues.service";
// ui
import { CustomMenu, PrimaryButton, Spinner } from "components/ui";
// fetch-keys
import {
  INBOX_ISSUES,
  ISSUE_DETAILS,
  PROJECT_ISSUES_ACTIVITY,
  SUB_ISSUES,
} from "constants/fetch-keys";

import {
  AddComment,
  IssueActivitySection,
  IssueAttachmentUpload,
  IssueAttachments,
  IssueDescriptionForm,
  IssueDetailsSidebar,
  SubIssuesList,
} from "components/issues";

// types
import type { IIssue } from "types";

type Props = {
  onAccept: () => void;
  control: Control<IIssue, any>;
  watch: UseFormWatch<IIssue>;
  reset: UseFormReset<IIssue>;
  status?: -2 | -1 | 0 | 1 | 2;
};

export const InboxMainContent: React.FC<Props> = (props) => {
  const { onAccept, watch, control, reset, status } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, issueId, inboxId } = router.query;

  const {
    data: issueDetails,
    mutate: mutateIssueDetails,
    error: issueDetailError,
  } = useSWR<IIssue | undefined>(
    workspaceSlug && projectId && issueId && status && status === 1
      ? ISSUE_DETAILS(issueId as string)
      : null,
    workspaceSlug && projectId && issueId && status && status === 1
      ? () =>
          issuesService.retrieve(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const { data: siblingIssues } = useSWR(
    workspaceSlug && projectId && issueDetails?.parent ? SUB_ISSUES(issueDetails.parent) : null,
    workspaceSlug && projectId && issueDetails?.parent
      ? () =>
          issuesService.subIssues(
            workspaceSlug as string,
            projectId as string,
            issueDetails.parent ?? ""
          )
      : null
  );

  useEffect(() => {
    if (!issueDetails || !issueId) return;

    mutate(PROJECT_ISSUES_ACTIVITY(issueId.toString()));
    reset({
      ...issueDetails,
      blockers_list:
        issueDetails.blockers_list ??
        issueDetails.blocker_issues?.map((issue) => issue.blocker_issue_detail?.id),
      blocked_list:
        issueDetails.blocks_list ??
        issueDetails.blocked_issues?.map((issue) => issue.blocked_issue_detail?.id),
      assignees_list:
        issueDetails.assignees_list ?? issueDetails.assignee_details?.map((user) => user.id),
      labels_list: issueDetails.labels_list ?? issueDetails.labels,
      labels: issueDetails.labels_list ?? issueDetails.labels,
    });
  }, [issueDetails, reset, issueId]);

  const submitChanges = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId || !inboxId) return;

      mutate(
        ISSUE_DETAILS(issueId as string),
        (prevData: IIssue) => ({
          ...prevData,
          ...formData,
        }),
        false
      );

      const payload = { ...formData };
      await issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, payload)
        .then((res) => {
          mutateIssueDetails();
          mutate(INBOX_ISSUES(inboxId.toString()));
          mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId, mutateIssueDetails, inboxId]
  );

  if (status !== undefined && status !== 1)
    return (
      <div className="w-full h-full flex flex-col justify-center items-center">
        <div className="relative w-96 aspect-video">
          <Image src="/empty-state/empty-inbox.svg" alt="Empty Inbox" layout="fill" />
        </div>
        <div className="flex flex-col items-center justify-center gap-5">
          <h3 className="text-2xl font-semibold text-center">
            You haven{"'"}t accepted Inbox issue.
          </h3>
          <p className="text-center">
            You have to accept the issue to view, add files, change states and more.
          </p>
          <PrimaryButton onClick={onAccept}>Accept Inbox Issue</PrimaryButton>
        </div>
      </div>
    );

  if (!issueDetails && !issueDetailError)
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Spinner />
      </div>
    );

  if (issueDetails)
    return (
      <div className="flex h-full overflow-auto divide-x">
        <div className="basis-2/3 h-full overflow-auto p-5">
          <div>
            {issueDetails?.parent && issueDetails.parent !== "" ? (
              <div className="mb-5 flex w-min items-center gap-2 whitespace-nowrap rounded bg-brand-surface-2 p-2 text-xs">
                <Link
                  href={`/${workspaceSlug}/projects/${projectId as string}/issues/${
                    issueDetails.parent
                  }`}
                >
                  <a className="flex items-center gap-2 text-brand-secondary">
                    <span
                      className="block h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: issueDetails?.state_detail?.color,
                      }}
                    />
                    <span className="flex-shrink-0">
                      {issueDetails.project_detail.identifier}-
                      {issueDetails.parent_detail?.sequence_id}
                    </span>
                    <span className="truncate">
                      {issueDetails.parent_detail?.name.substring(0, 50)}
                    </span>
                  </a>
                </Link>

                <CustomMenu ellipsis>
                  {siblingIssues && siblingIssues.length > 0 ? (
                    siblingIssues.map((issue: IIssue) => (
                      <CustomMenu.MenuItem key={issue.id}>
                        <Link
                          href={`/${workspaceSlug}/projects/${projectId as string}/issues/${
                            issue.id
                          }`}
                        >
                          <a>
                            {issueDetails.project_detail.identifier}-{issue.sequence_id}
                          </a>
                        </Link>
                      </CustomMenu.MenuItem>
                    ))
                  ) : (
                    <CustomMenu.MenuItem className="flex items-center gap-2 whitespace-nowrap p-2 text-left text-xs text-brand-secondary">
                      No other sibling issues
                    </CustomMenu.MenuItem>
                  )}
                </CustomMenu>
              </div>
            ) : null}
            <IssueDescriptionForm issue={issueDetails} handleFormSubmit={submitChanges} />
            <div className="mt-2 space-y-2">
              <SubIssuesList parentIssue={issueDetails} />
            </div>

            <div className="flex flex-col gap-3 py-3">
              <h3 className="text-lg">Attachments</h3>
              <div className="grid  grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <IssueAttachmentUpload />
                <IssueAttachments />
              </div>
            </div>
            <div className="space-y-5 pt-3">
              <h3 className="text-lg text-brand-base">Comments/Activity</h3>
              <IssueActivitySection />
              <AddComment />
            </div>
          </div>
        </div>

        <div className="basis-1/3 space-y-5 border-brand-base p-5">
          <IssueDetailsSidebar
            control={control}
            issueDetail={issueDetails}
            submitChanges={submitChanges}
            watch={watch}
          />
        </div>
      </div>
    );

  return null;
};
