"use client";

import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// plane types
import { TIssue } from "@plane/types";
// plane ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { InboxIssueContentProperties } from "@/components/inbox/content";
import {
  IssueDescriptionInput,
  IssueTitleInput,
  IssueActivity,
  IssueReaction,
  TIssueOperations,
  IssueAttachmentRoot,
} from "@/components/issues";
// constants
import { ISSUE_ARCHIVED, ISSUE_DELETED } from "@/constants/event-tracker";
// helpers
import { getTextContent } from "@/helpers/editor.helper";
// hooks
import { useEventTracker, useIssueDetail, useProject, useUser } from "@/hooks/store";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// store types
import { DeDupeIssuePopoverRoot } from "@/plane-web/components/de-dupe";
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
// services
import { InboxIssueService } from "@/services/inbox";
const inboxIssueService = new InboxIssueService();
import { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore;
  isEditable: boolean;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: Dispatch<SetStateAction<"submitting" | "submitted" | "saved">>;
};

export const InboxIssueMainContent: React.FC<Props> = observer((props) => {
  const pathname = usePathname();
  const { workspaceSlug, projectId, inboxIssue, isEditable, isSubmitting, setIsSubmitting } = props;
  // hooks
  const { data: currentUser } = useUser();
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");
  const { captureIssueEvent } = useEventTracker();
  const { getProjectById } = useProject();
  const { removeIssue, archiveIssue } = useIssueDetail();

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

  // derived values
  const issue = inboxIssue.issue;
  const projectDetails = issue?.project_id ? getProjectById(issue?.project_id) : undefined;

  // debounced duplicate issues swr
  const { duplicateIssues } = useDebouncedDuplicateIssues(projectDetails?.workspace.toString(), projectId, {
    name: issue?.name,
    description_html: getTextContent(issue?.description_html),
    issueId: issue?.id,
  });

  if (!issue) return <></>;

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      fetch: async () => {},
      remove: async (_workspaceSlug, _projectId, _issueId) => {
        try {
          await removeIssue(workspaceSlug, projectId, _issueId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Issue deleted successfully",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: _issueId, state: "SUCCESS", element: "Issue detail page" },
            path: pathname,
          });
        } catch (error) {
          console.log("Error in deleting issue:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Issue delete failed",
          });
          captureIssueEvent({
            eventName: ISSUE_DELETED,
            payload: { id: _issueId, state: "FAILED", element: "Issue detail page" },
            path: pathname,
          });
        }
      },
      update: async (_workspaceSlug, _projectId, _issueId, data) => {
        try {
          await inboxIssue.updateIssue(data);
          captureIssueEvent({
            eventName: "Inbox issue updated",
            payload: { ...data, state: "SUCCESS", element: "Inbox" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: pathname,
          });
        } catch {
          setToast({
            title: "Issue update failed",
            type: TOAST_TYPE.ERROR,
            message: "Issue update failed",
          });
          captureIssueEvent({
            eventName: "Inbox issue updated",
            payload: { state: "SUCCESS", element: "Inbox" },
            updates: {
              changed_property: Object.keys(data).join(","),
              change_details: Object.values(data).join(","),
            },
            path: pathname,
          });
        }
      },
      updateDescription: async (_workspaceSlug, _projectId, _issueId, descriptionBinary) => {
        try {
          return await inboxIssue.updateIssueDescription(descriptionBinary);
        } catch {
          throw new Error("Failed to update issue description");
        }
      },
      archive: async (workspaceSlug, projectId, issueId) => {
        try {
          await archiveIssue(workspaceSlug, projectId, issueId);
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "SUCCESS", element: "Issue details page" },
            path: pathname,
          });
        } catch (error) {
          console.log("Error in archiving issue:", error);
          captureIssueEvent({
            eventName: ISSUE_ARCHIVED,
            payload: { id: issueId, state: "FAILED", element: "Issue details page" },
            path: pathname,
          });
        }
      },
    }),
    [archiveIssue, captureIssueEvent, inboxIssue, pathname, projectId, removeIssue, workspaceSlug]
  );

  if (!issue?.project_id || !issue?.id) return <></>;

  return (
    <>
      <div className="rounded-lg space-y-4">
        {duplicateIssues.length > 0 && (
          <DeDupeIssuePopoverRoot
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            rootIssueId={issue.id}
            issues={duplicateIssues}
            issueOperations={issueOperations}
            isIntakeIssue
          />
        )}
        <IssueTitleInput
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          isSubmitting={isSubmitting}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          issueOperations={issueOperations}
          disabled={!isEditable}
          value={issue.name}
          containerClassName="-ml-3"
        />

        {issue.description_binary !== undefined && (
          <IssueDescriptionInput
            key={issue.id}
            containerClassName="-ml-3 border-none"
            descriptionBinary={issue.description_binary}
            descriptionHTML={issue.description_html ?? "<p></p>"}
            disabled={!isEditable}
            fetchDescription={async () => {
              if (!workspaceSlug || !projectId || !issue.id) {
                throw new Error("Required fields missing while fetching binary description");
              }
              return await inboxIssueService.fetchDescriptionBinary(workspaceSlug, projectId, issue.id);
            }}
            updateDescription={async (data) => {
              if (!workspaceSlug || !projectId || !issue.id) {
                throw new Error("Required fields missing while updating binary description");
              }
              return await issueOperations.updateDescription(workspaceSlug, projectId, issue.id, data);
            }}
            issueId={issue.id}
            projectId={issue.project_id}
            setIsSubmitting={(value) => setIsSubmitting(value)}
            workspaceSlug={workspaceSlug}
          />
        )}

        {currentUser && (
          <IssueReaction
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issue.id}
            currentUser={currentUser}
          />
        )}
      </div>

      <IssueAttachmentRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issue.id}
        disabled={!isEditable}
      />

      <InboxIssueContentProperties
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issue={issue}
        issueOperations={issueOperations}
        isEditable={isEditable}
        duplicateIssueDetails={inboxIssue?.duplicate_issue_detail}
      />

      <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issue.id} isIntakeIssue />
    </>
  );
});
