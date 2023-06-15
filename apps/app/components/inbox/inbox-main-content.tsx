import { useCallback, useEffect } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react hook form
import { useForm } from "react-hook-form";
// services
import inboxServices from "services/inbox.service";
// hooks
import useInboxView from "hooks/use-inbox-view";
// ui
import { Loader } from "components/ui";
// hooks
import useUser from "hooks/use-user";
// fetch-keys
import { INBOX_ISSUES, INBOX_ISSUE_DETAILS } from "constants/fetch-keys";

import {
  AddComment,
  IssueActivitySection,
  IssueDescriptionForm,
  IssueDetailsSidebar,
} from "components/issues";

// types
import type { IInboxIssue, IIssue } from "types";

const defaultValues = {
  name: "",
  description: "",
  description_html: "",
  estimate_point: null,
  assignees_list: [],
  priority: "low",
  target_date: new Date().toString(),
  labels_list: [],
};

export const InboxMainContent: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;

  const { user } = useUser();
  const { params } = useInboxView();

  const { reset, control, watch } = useForm<IIssue>({
    defaultValues,
  });

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
    async (formData: Partial<IInboxIssue>) => {
      if (!workspaceSlug || !projectId || !inboxIssueId || !inboxId || !issueDetails) return;

      mutateIssueDetails((prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          issue_detail: {
            ...prevData.issue_detail,
            ...formData,
          },
        };
      }, false);
      mutate<IInboxIssue[]>(
        INBOX_ISSUES(inboxId.toString(), params),
        (prevData) =>
          (prevData ?? []).map((i) => {
            if (i.bridge_id === inboxIssueId) {
              return {
                ...i,
                ...formData,
              };
            }

            return i;
          }),
        false
      );

      const payload = { issue: { ...formData } };

      await inboxServices
        .patchInboxIssue(
          workspaceSlug.toString(),
          projectId.toString(),
          inboxId.toString(),
          issueDetails.id,
          payload,
          user
        )
        .then(() => {
          mutateIssueDetails();
          mutate(INBOX_ISSUES(inboxId.toString(), params));
        });
    },
    [
      workspaceSlug,
      inboxIssueId,
      projectId,
      mutateIssueDetails,
      inboxId,
      user,
      issueDetails,
      params,
    ]
  );

  return (
    <>
      {issueDetails ? (
        <div className="flex h-full overflow-auto divide-x">
          <div className="basis-2/3 h-full overflow-auto p-5">
            <div>
              <IssueDescriptionForm
                issue={{
                  name: issueDetails.issue_detail.name ?? "",
                  description: issueDetails.issue_detail.description,
                  description_html: issueDetails.issue_detail.description_html,
                }}
                handleFormSubmit={submitChanges}
              />
            </div>
            <div className="space-y-5 pt-3">
              <h3 className="text-lg text-brand-base">Comments/Activity</h3>
              <IssueActivitySection issueId={issueDetails.id} user={user} />
              <AddComment user={user} />
            </div>
          </div>

          <div className="basis-1/3 space-y-5 border-brand-base p-5">
            <IssueDetailsSidebar
              control={control}
              issueDetail={{
                ...issueDetails.issue_detail,
                project_detail: issueDetails.project_detail,
              }}
              submitChanges={submitChanges}
              watch={watch}
              fieldsToShow={{
                assignee: true,
                priority: true,
                estimate: true,
                dueDate: true,
                label: true,
              }}
            />
          </div>
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
