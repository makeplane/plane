import { useCallback, useEffect } from "react";
import Router, { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { AlertTriangle, CheckCircle2, Clock, Copy, ExternalLink, Inbox, XCircle } from "lucide-react";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// contexts
import { useProjectMyMembership } from "contexts/project-member.context";
// components
import { IssueDescriptionForm, IssueDetailsSidebar, IssueReaction } from "components/issues";
import { InboxIssueActivity } from "components/inbox";
// ui
import { Loader } from "@plane/ui";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IInboxIssue, IIssue } from "types";

const defaultValues: Partial<IInboxIssue> = {
  name: "",
  description_html: "",
  assignees: [],
  priority: "low",
  target_date: new Date().toString(),
  labels: [],
};

export const InboxMainContent: React.FC = observer(() => {
  const router = useRouter();
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = router.query;

  const { inboxIssues: inboxIssuesStore, inboxIssueDetails: inboxIssueDetailsStore, user: userStore } = useMobxStore();

  const user = userStore.currentUser;

  const { memberRole } = useProjectMyMembership();

  const { reset, control, watch } = useForm<IIssue>({
    defaultValues,
  });

  useSWR(
    workspaceSlug && projectId && inboxId && inboxIssueId ? `INBOX_ISSUE_DETAILS_${inboxIssueId.toString()}` : null,
    workspaceSlug && projectId && inboxId && inboxIssueId
      ? () =>
          inboxIssueDetailsStore.fetchIssueDetails(
            workspaceSlug.toString(),
            projectId.toString(),
            inboxId.toString(),
            inboxIssueId.toString()
          )
      : null
  );

  const issuesList = inboxId ? inboxIssuesStore.inboxIssues[inboxId.toString()] : undefined;
  const issueDetails = inboxIssueId ? inboxIssueDetailsStore.issueDetails[inboxIssueId.toString()] : undefined;

  const submitChanges = useCallback(
    async (formData: Partial<IInboxIssue>) => {
      if (!workspaceSlug || !projectId || !inboxIssueId || !inboxId || !issueDetails) return;

      await inboxIssueDetailsStore.updateIssue(
        workspaceSlug.toString(),
        projectId.toString(),
        inboxId.toString(),
        issueDetails.issue_inbox[0].id,
        formData
      );
    },
    [workspaceSlug, inboxIssueId, projectId, inboxId, issueDetails, inboxIssueDetailsStore]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!issuesList || !inboxIssueId) return;

      const currentIssueIndex = issuesList.findIndex((issue) => issue.issue_inbox[0].id === inboxIssueId);

      switch (e.key) {
        case "ArrowUp":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              inboxIssueId:
                currentIssueIndex === 0
                  ? issuesList[issuesList.length - 1].issue_inbox[0].id
                  : issuesList[currentIssueIndex - 1].issue_inbox[0].id,
            },
          });
          break;
        case "ArrowDown":
          Router.push({
            pathname: `/${workspaceSlug}/projects/${projectId}/inbox/${inboxId}`,
            query: {
              inboxIssueId:
                currentIssueIndex === issuesList.length - 1
                  ? issuesList[0].issue_inbox[0].id
                  : issuesList[currentIssueIndex + 1].issue_inbox[0].id,
            },
          });
          break;
        default:
          break;
      }
    },
    [workspaceSlug, projectId, inboxIssueId, inboxId, issuesList]
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
      assignees: issueDetails.assignees ?? (issueDetails.assignee_details ?? []).map((user) => user.id),
      labels: issueDetails.labels ?? issueDetails.labels,
    });
  }, [issueDetails, reset, inboxIssueId]);

  const issueStatus = issueDetails?.issue_inbox[0].status;

  if (!inboxIssueId)
    return (
      <div className="h-full p-4 grid place-items-center text-custom-text-200">
        <div className="grid h-full place-items-center">
          <div className="my-5 flex flex-col items-center gap-4">
            <Inbox size={60} strokeWidth={1.5} />
            {issuesList && issuesList.length > 0 ? (
              <span className="text-custom-text-200">
                {issuesList?.length} issues found. Select an issue from the sidebar to view its details.
              </span>
            ) : (
              <span className="text-custom-text-200">No issues found</span>
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
                  <AlertTriangle size={18} strokeWidth={2} />
                  <p>This issue is still pending.</p>
                </>
              ) : issueStatus === -1 ? (
                <>
                  <XCircle size={18} strokeWidth={2} />
                  <p>This issue has been declined.</p>
                </>
              ) : issueStatus === 0 ? (
                <>
                  <Clock size={18} strokeWidth={2} />
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
                  <CheckCircle2 size={18} strokeWidth={2} />
                  <p>This issue has been accepted.</p>
                </>
              ) : issueStatus === 2 ? (
                <>
                  <Copy size={18} strokeWidth={2} />
                  <p className="flex items-center gap-1">
                    This issue has been marked as a duplicate of
                    <a
                      href={`/${workspaceSlug}/projects/${projectId}/issues/${issueDetails.issue_inbox[0].duplicate_to}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline flex items-center gap-2"
                    >
                      this issue <ExternalLink size={12} strokeWidth={2} />
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

          <div className="basis-1/3 space-y-5 border-custom-border-200 py-5">
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
});
