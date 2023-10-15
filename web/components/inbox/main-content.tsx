import { useCallback, useEffect } from "react";

import Router, { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react hook form
import { useForm } from "react-hook-form";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// services
import { InboxService } from "services/inbox.service";
// hooks
import useInboxView from "hooks/use-inbox-view";
import useUserAuth from "hooks/use-user-auth";
// components
import { IssueDescriptionForm, IssueDetailsSidebar, IssueReaction } from "components/issues";
import { InboxIssueActivity } from "components/inbox";
// ui
import { Loader } from "@plane/ui";
// icons
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import type { IInboxIssue, IIssue, IUser } from "types";
// fetch-keys
import { INBOX_ISSUES, INBOX_ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";

const defaultValues: Partial<IInboxIssue> = {
  name: "",
  description_html: "",
  estimate_point: null,
  assignees_list: [],
  priority: "low",
  target_date: new Date().toString(),
  labels_list: [],
};

const inboxService = new InboxService();

export const InboxMainContent: React.FC = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;

  const { user } = useUserAuth();
  const { memberRole } = useProjectMyMembership();
  const { params, issues: inboxIssues } = useInboxView();

  const { reset, control, watch } = useForm<IIssue>({
    defaultValues,
  });

  const { data: issueDetails, mutate: mutateIssueDetails } = useSWR(
    workspaceSlug && projectId && inboxId && inboxIssueId
      ? INBOX_ISSUE_DETAILS(inboxId.toString(), inboxIssueId.toString())
      : null,
    workspaceSlug && projectId && inboxId && inboxIssueId
      ? () =>
          inboxService.getInboxIssueById(
            workspaceSlug.toString(),
            projectId.toString(),
            inboxId.toString(),
            inboxIssueId.toString()
          )
      : null
  );

  const submitChanges = useCallback(
    async (formData: Partial<IInboxIssue>) => {
      if (!workspaceSlug || !projectId || !inboxIssueId || !inboxId || !issueDetails) return;

      mutateIssueDetails((prevData: any) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          ...formData,
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

      await inboxService
        .patchInboxIssue(
          workspaceSlug.toString(),
          projectId.toString(),
          inboxId.toString(),
          issueDetails.issue_inbox[0].id,
          payload,
          user as IUser
        )
        .then(() => {
          mutateIssueDetails();
          mutate(INBOX_ISSUES(inboxId.toString(), params));
          mutate(PROJECT_ISSUES_ACTIVITY(issueDetails.id));
        });
    },
    [workspaceSlug, inboxIssueId, projectId, mutateIssueDetails, inboxId, user, issueDetails, params]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!inboxIssues || !inboxIssueId) return;

      const currentIssueIndex = inboxIssues.findIndex((issue: any) => issue.bridge_id === inboxIssueId);

      switch (e.key) {
        case "ArrowUp":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              inboxIssueId:
                currentIssueIndex === 0
                  ? inboxIssues[inboxIssues.length - 1].bridge_id
                  : inboxIssues[currentIssueIndex - 1].bridge_id,
            },
          });
          break;
        case "ArrowDown":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              inboxIssueId:
                currentIssueIndex === inboxIssues.length - 1
                  ? inboxIssues[0].bridge_id
                  : inboxIssues[currentIssueIndex + 1].bridge_id,
            },
          });
          break;
        default:
          break;
      }
    },
    [workspaceSlug, projectId, inboxIssueId, inboxId, inboxIssues]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  useEffect(() => {
    if (!issueDetails || !inboxIssueId) return;

    reset({
      ...issueDetails,
      assignees_list: issueDetails.assignees_list ?? (issueDetails.assignee_details ?? []).map((user) => user.id),
      labels_list: issueDetails.labels_list ?? issueDetails.labels,
    });
  }, [issueDetails, reset, inboxIssueId]);

  const issueStatus = issueDetails?.issue_inbox[0].status;

  if (!inboxIssueId)
    return (
      <div className="h-full p-4 grid place-items-center text-custom-text-200">
        <div className="grid h-full place-items-center">
          <div className="my-5 flex flex-col items-center gap-4">
            <InboxIcon height={60} width={60} />
            {inboxIssues && inboxIssues.length > 0 ? (
              <span className="text-custom-text-200">
                {inboxIssues?.length} issues found. Select an issue from the sidebar to view its details.
              </span>
            ) : (
              <span className="text-custom-text-200">
                No issues found. Use <pre className="inline rounded bg-custom-background-80 px-2 py-1">C</pre> shortcut
                to create a new issue
              </span>
            )}
          </div>
        </div>
      </div>
    );

  return (
    <>
      {issueDetails ? (
        <div className="flex h-full overflow-auto divide-x">
          <div className="basis-2/3 h-full overflow-auto p-5 space-y-3">
            <div
              className={`flex items-center gap-2 p-3 text-sm border rounded-md ${
                issueStatus === -2
                  ? "text-yellow-500 border-yellow-500 bg-yellow-500/10"
                  : issueStatus === -1
                  ? "text-red-500 border-red-500 bg-red-500/10"
                  : issueStatus === 0
                  ? new Date(issueDetails.issue_inbox[0].snoozed_till ?? "") < new Date()
                    ? "text-red-500 border-red-500 bg-red-500/10"
                    : "text-custom-text-200 border-gray-500 bg-gray-500/10"
                  : issueStatus === 1
                  ? "text-green-500 border-green-500 bg-green-500/10"
                  : issueStatus === 2
                  ? "text-custom-text-200 border-gray-500 bg-gray-500/10"
                  : ""
              }`}
            >
              {issueStatus === -2 ? (
                <>
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <p>This issue is still pending.</p>
                </>
              ) : issueStatus === -1 ? (
                <>
                  <XCircleIcon className="h-5 w-5" />
                  <p>This issue has been declined.</p>
                </>
              ) : issueStatus === 0 ? (
                <>
                  <ClockIcon className="h-5 w-5" />
                  {new Date(issueDetails.issue_inbox[0].snoozed_till ?? "") < new Date() ? (
                    <p>
                      This issue was snoozed till{" "}
                      {renderShortDateWithYearFormat(issueDetails.issue_inbox[0].snoozed_till ?? "")}.
                    </p>
                  ) : (
                    <p>
                      This issue has been snoozed till{" "}
                      {renderShortDateWithYearFormat(issueDetails.issue_inbox[0].snoozed_till ?? "")}.
                    </p>
                  )}
                </>
              ) : issueStatus === 1 ? (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <p>This issue has been accepted.</p>
                </>
              ) : issueStatus === 2 ? (
                <>
                  <DocumentDuplicateIcon className="h-5 w-5" />
                  <p className="flex items-center gap-1">
                    This issue has been marked as a duplicate of
                    <a
                      href={`/${workspaceSlug}/projects/${projectId}/issues/${issueDetails.issue_inbox[0].duplicate_to}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline flex items-center gap-2"
                    >
                      this issue <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </a>
                    .
                  </p>
                </>
              ) : null}
            </div>
            <div>
              <IssueDescriptionForm
                workspaceSlug={workspaceSlug as string}
                issue={{
                  name: issueDetails.name,
                  description_html: issueDetails.description_html,
                }}
                handleFormSubmit={submitChanges}
                isAllowed={memberRole.isMember || memberRole.isOwner || user?.id === issueDetails.created_by}
              />
            </div>

            <IssueReaction projectId={projectId} workspaceSlug={workspaceSlug} issueId={issueDetails.id} />

            <InboxIssueActivity issueDetails={issueDetails} />
          </div>

          <div className="basis-1/3 space-y-5 border-custom-border-200 p-5">
            <IssueDetailsSidebar
              control={control}
              issueDetail={issueDetails}
              submitChanges={submitChanges}
              watch={watch}
              fieldsToShow={["assignee", "priority", "estimate", "dueDate", "label", "state"]}
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
};
