import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { InboxIssueProperties } from "@/components/inbox/content";
import {
  IssueDescriptionInput,
  IssueTitleInput,
  IssueActivity,
  IssueReaction,
  TIssueOperations,
  IssueUpdateStatus,
} from "@/components/issues";
// hooks
import { useUser } from "@/hooks/store";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// store types
import { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      fetch: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          return;
        } catch (error) {
          setToast({
            title: "Issue fetch failed",
            type: TOAST_TYPE.ERROR,
            message: "Issue fetch failed",
          });
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      remove: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          return;
        } catch (error) {
          setToast({
            title: "Issue remove failed",
            type: TOAST_TYPE.ERROR,
            message: "Issue remove failed",
          });
        }
      },
      update: async (workspaceSlug: string, projectId: string, issueId: string, data: Partial<TIssue>) => {
        try {
          await inboxIssue.updateIssue(data);
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
    }),
    [inboxIssue]
  );

  if (!issue?.project_id || !issue?.id) return <></>;
  return (
    <>
      <div className="rounded-lg space-y-4">
        <div className="flex items-center justify-end w-full">
          <IssueUpdateStatus isSubmitting={isSubmitting} />
        </div>
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

      <InboxIssueProperties
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
