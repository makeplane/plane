import { useCallback, useEffect } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react hook form
import { Control, UseFormReset, UseFormWatch } from "react-hook-form";
// services
import issuesService from "services/issues.service";
import inboxServices from "services/inbox.service";
// ui
import { Loader } from "components/ui";
// hooks
import useUser from "hooks/use-user";
// fetch-keys
import { INBOX_ISSUES, INBOX_ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

import { IssueDescriptionForm } from "components/issues";

// types
import type { IInboxIssue, IInboxIssueDetail } from "types";

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
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;

  const { user } = useUser();

  const { data: issueDetails, mutate: mutateIssueDetails } = useSWR(
    workspaceSlug && projectId && inboxId && inboxIssueId
      ? INBOX_ISSUE_DETAILS(inboxId.toString(), inboxIssueId.toString())
      : null,
    workspaceSlug && projectId && inboxId && inboxIssueId
      ? () =>
          inboxServices.getInboxIssueById(
            workspaceSlug.toString(),
            projectId.toString(),
            inboxId.toString(),
            inboxIssueId.toString()
          )
      : null
  );

  useEffect(() => {
    if (!issueDetails || !inboxIssueId) return;

    reset({
      ...issueDetails.issue_detail,
    });
  }, [issueDetails, reset, inboxIssueId]);

  const submitChanges = useCallback(
    async (formData: Partial<IInboxIssueDetail>) => {
      if (!workspaceSlug || !projectId || !inboxIssueId || !inboxId) return;

      mutate<IInboxIssueDetail>(
        INBOX_ISSUE_DETAILS(inboxId.toString(), inboxIssueId.toString()),
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
          inboxIssueId.toString(),
          payload,
          user
        )
        .then((res) => {
          mutateIssueDetails();
          mutate(INBOX_ISSUES(inboxId.toString()));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, inboxIssueId, projectId, mutateIssueDetails, inboxId, user]
  );

  return (
    <>
      {issueDetails ? (
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
      ) : (
        <Loader className="flex h-full gap-5 p-5">
          <div className="basis-2/3 space-y-2">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="40%" />
          </div>
          <div className="basis-1/3 space-y-3">
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
          </div>
        </Loader>
      )}
    </>
  );

  return null;
};
