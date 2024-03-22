import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useIssueDetail, useProjectState, useUser } from "hooks/store";
import useReloadConfirmations from "hooks/use-reload-confirmation";
// components
import {
  IssueDescriptionInput,
  IssueTitleInput,
  IssueActivity,
  IssueReaction,
  TIssueOperations,
} from "components/issues";
import { IInboxIssueStore } from "store/inbox-issue.store";
import { TIssue } from "@plane/types";
import { InboxIssueDetailsSidebar } from "./sidebar";

type Props = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore;
  is_editable: boolean;
};

export const InboxIssueMainContent: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssue, is_editable } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // hooks
  const { currentUser } = useUser();
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 3000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  const issue = inboxIssue.issue;
  if (!issue) return <></>;

  const issueDescription =
    issue.description_html !== undefined || issue.description_html !== null
      ? issue.description_html != ""
        ? issue.description_html
        : "<p></p>"
      : undefined;

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await inboxIssue.fetchInboxIssue();
        } catch (error) {
          console.error("Error fetching the parent issue");
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await inboxIssue.updateInboxIssue(data);
          // captureIssueEvent({
          //   eventName: "Inbox issue updated",
          //   payload: { ...data, state: "SUCCESS", element: "Inbox" },
          //   updates: {
          //     changed_property: Object.keys(data).join(","),
          //     change_details: Object.values(data).join(","),
          //   },
          //   path: router.asPath,
          // });
        } catch (error) {
          setToast({
            title: "Issue update failed",
            type: TOAST_TYPE.ERROR,
            message: "Issue update failed",
          });
          // captureIssueEvent({
          //   eventName: "Inbox issue updated",
          //   payload: { state: "SUCCESS", element: "Inbox" },
          //   updates: {
          //     changed_property: Object.keys(data).join(","),
          //     change_details: Object.values(data).join(","),
          //   },
          //   path: router.asPath,
          // });
        }
      },
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await inboxIssue.deleteInboxIssue();
          setToast({
            title: "Issue deleted successfully",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          // captureIssueEvent({
          //   eventName: "Inbox issue deleted",
          //   payload: { id: issueId, state: "SUCCESS", element: "Inbox" },
          //   path: router.asPath,
          // });
        } catch (error) {
          // captureIssueEvent({
          //   eventName: "Inbox issue deleted",
          //   payload: { id: issueId, state: "FAILED", element: "Inbox" },
          //   path: router.asPath,
          // });
          setToast({
            title: "Issue delete failed",
            type: TOAST_TYPE.ERROR,
            message: "Issue delete failed",
          });
        }
      },
    }),
    [inboxIssue]
  );

  return (
    <>
      <div className="rounded-lg space-y-4">
        <IssueTitleInput
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          isSubmitting={isSubmitting}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          issueOperations={issueOperations}
          disabled={!is_editable}
          value={issue.name}
        />

        <IssueDescriptionInput
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          value={issueDescription}
          initialValue={issueDescription}
          disabled={!is_editable}
          issueOperations={issueOperations}
          setIsSubmitting={(value) => setIsSubmitting(value)}
        />

        {currentUser && (
          <IssueReaction
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issue.id}
            currentUser={currentUser}
          />
        )}
      </div>

      <InboxIssueDetailsSidebar
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issue.id}
        issueOperations={issueOperations}
        is_editable={is_editable}
      />

      <div className="pb-12">
        <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issue.id} />
      </div>
    </>
  );
});
