import { useCallback, useEffect } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react hook form
import { Control, UseFormReset, UseFormWatch } from "react-hook-form";
// services
import issuesService from "services/issues.service";
import inboxServices from "services/inbox.service";
// ui
import { Spinner } from "components/ui";
// hooks
import useUser from "hooks/use-user";
// fetch-keys
import {
  INBOX_ISSUES,
  INBOX_ISSUE_DETAILS,
  ISSUE_DETAILS,
  PROJECT_ISSUES_ACTIVITY,
} from "constants/fetch-keys";

import { IssueDescriptionForm, IssueDetailsSidebar } from "components/issues";

// types
import type { IInboxIssue, IIssue } from "types";

type Props = {
  onAccept: () => void;
  control: Control<IInboxIssue, any>;
  watch: UseFormWatch<IInboxIssue>;
  reset: UseFormReset<IInboxIssue>;
  status?: -2 | -1 | 0 | 1 | 2;
};

export const InboxMainContent: React.FC<Props> = (props) => {
  const { onAccept, watch, control, reset, status } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, issueId } = router.query;

  const { user } = useUser();

  const {
    data: issueDetails,
    mutate: mutateIssueDetails,
    error: issueDetailError,
  } = useSWR(
    workspaceSlug && projectId && inboxId && issueId
      ? INBOX_ISSUE_DETAILS(inboxId.toString(), issueId.toString())
      : null,
    workspaceSlug && projectId && inboxId && issueId
      ? () =>
          inboxServices.getInboxIssueById(
            workspaceSlug.toString(),
            projectId.toString(),
            inboxId.toString(),
            issueId.toString()
          )
      : null
  );

  useEffect(() => {
    if (!issueDetails || !issueId) return;

    reset({
      ...issueDetails.issue_detail,
    });
  }, [issueDetails, reset, issueId]);

  const submitChanges = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !issueId || !inboxId) return;

      mutate<IIssue>(
        INBOX_ISSUE_DETAILS(inboxId.toString(), issueId.toString()),
        (prevData) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            ...formData,
          };
        },
        false
      );

      const payload = { ...formData };
      await issuesService
        .patchIssue(
          workspaceSlug.toString(),
          projectId.toString(),
          issueId.toString(),
          payload,
          user
        )
        .then((res) => {
          mutateIssueDetails();
          mutate(INBOX_ISSUES(inboxId.toString()));
          mutate(PROJECT_ISSUES_ACTIVITY(issueId.toString()));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, issueId, projectId, mutateIssueDetails, inboxId, user]
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
            <IssueDescriptionForm
              issue={{
                name: issueDetails.issue_detail.name,
                description: issueDetails.issue_detail.description,
                description_html: issueDetails.issue_detail.description_html,
              }}
              handleFormSubmit={submitChanges}
            />
          </div>
        </div>

        {/* <div className="basis-1/3 space-y-5 border-brand-base p-5">
          <IssueDetailsSidebar
            control={control}
            issueDetail={issueDetails}
            submitChanges={submitChanges}
            watch={watch}
          />
        </div> */}
      </div>
    );

  return null;
};
