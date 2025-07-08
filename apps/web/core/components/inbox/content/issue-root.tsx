"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { WORK_ITEM_TRACKER_EVENTS } from "@plane/constants";
import { EditorRefApi } from "@plane/editor";
import { EInboxIssueSource, TIssue, TNameDescriptionLoader } from "@plane/types";
import { Loader, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { getTextContent } from "@plane/utils";
import { DescriptionVersionsRoot } from "@/components/core/description-versions";
import { InboxIssueContentProperties } from "@/components/inbox/content";
import {
  IssueDescriptionInput,
  IssueTitleInput,
  IssueActivity,
  IssueReaction,
  TIssueOperations,
  IssueAttachmentRoot,
} from "@/components/issues";
// helpers
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useIssueDetail, useMember, useProject, useProjectInbox, useUser } from "@/hooks/store";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// store types
import { DeDupeIssuePopoverRoot } from "@/plane-web/components/de-dupe";
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
// services
import { IntakeWorkItemVersionService } from "@/services/inbox";
// stores
import { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
// services init
const intakeWorkItemVersionService = new IntakeWorkItemVersionService();

type Props = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore;
  isEditable: boolean;
  isSubmitting: TNameDescriptionLoader;
  setIsSubmitting: Dispatch<SetStateAction<TNameDescriptionLoader>>;
};

export const InboxIssueMainContent: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssue, isEditable, isSubmitting, setIsSubmitting } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { data: currentUser } = useUser();
  const { getUserDetails } = useMember();
  const { loader } = useProjectInbox();
  const { getProjectById } = useProject();
  const { removeIssue, archiveIssue } = useIssueDetail();
  // reload confirmation
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

  // derived values
  const issue = inboxIssue.issue;
  const projectDetails = issue?.project_id ? getProjectById(issue?.project_id) : undefined;

  // debounced duplicate issues swr
  const { duplicateIssues } = useDebouncedDuplicateIssues(
    workspaceSlug,
    projectDetails?.workspace.toString(),
    projectId,
    {
      name: issue?.name,
      description_html: getTextContent(issue?.description_html),
      issueId: issue?.id,
    }
  );

  if (!issue) return <></>;

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars, arrow-body-style
      fetch: async (_workspaceSlug: string, _projectId: string, _issueId: string) => {
        return;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars, arrow-body-style
      remove: async (_workspaceSlug: string, _projectId: string, _issueId: string) => {
        try {
          await removeIssue(workspaceSlug, projectId, _issueId);
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: "Work item deleted successfully",
          });
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.delete,
            payload: { id: _issueId },
          });
        } catch (error) {
          console.log("Error in deleting work item:", error);
          setToast({
            title: "Error!",
            type: TOAST_TYPE.ERROR,
            message: "Work item delete failed",
          });
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.delete,
            payload: { id: _issueId },
            error: error as Error,
          });
        }
      },
      update: async (_workspaceSlug: string, _projectId: string, _issueId: string, data: Partial<TIssue>) => {
        try {
          await inboxIssue.updateIssue(data);
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: _issueId },
          });
        } catch (error) {
          setToast({
            title: "Work item update failed",
            type: TOAST_TYPE.ERROR,
            message: "Work item update failed",
          });
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.update,
            payload: { id: _issueId },
            error: error as Error,
          });
        }
      },
      archive: async (workspaceSlug: string, projectId: string, issueId: string) => {
        try {
          await archiveIssue(workspaceSlug, projectId, issueId);
          captureSuccess({
            eventName: WORK_ITEM_TRACKER_EVENTS.archive,
            payload: { id: issueId },
          });
        } catch (error) {
          console.log("Error in archiving issue:", error);
          captureError({
            eventName: WORK_ITEM_TRACKER_EVENTS.archive,
            payload: { id: issueId },
            error: error as Error,
          });
        }
      },
    }),
    [inboxIssue]
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

        {loader === "issue-loading" ? (
          <Loader className="min-h-[6rem] rounded-md border border-custom-border-200">
            <Loader.Item width="100%" height="140px" />
          </Loader>
        ) : (
          <IssueDescriptionInput
            editorRef={editorRef}
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            issueId={issue.id}
            swrIssueDescription={issue.description_html ?? "<p></p>"}
            initialValue={issue.description_html ?? "<p></p>"}
            disabled={!isEditable}
            issueOperations={issueOperations}
            setIsSubmitting={(value) => setIsSubmitting(value)}
            containerClassName="-ml-3 border-none"
          />
        )}

        <div className="flex items-center justify-between gap-2">
          {currentUser && (
            <IssueReaction
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issue.id}
              currentUser={currentUser}
            />
          )}
          {isEditable && (
            <DescriptionVersionsRoot
              className="flex-shrink-0"
              entityInformation={{
                createdAt: issue.created_at ? new Date(issue.created_at) : new Date(),
                createdByDisplayName:
                  inboxIssue.source === EInboxIssueSource.FORMS
                    ? "Intake Form user"
                    : (getUserDetails(issue.created_by ?? "")?.display_name ?? ""),
                id: issue.id,
                isRestoreDisabled: !isEditable,
              }}
              fetchHandlers={{
                listDescriptionVersions: (issueId) =>
                  intakeWorkItemVersionService.listDescriptionVersions(workspaceSlug, projectId, issueId),
                retrieveDescriptionVersion: (issueId, versionId) =>
                  intakeWorkItemVersionService.retrieveDescriptionVersion(workspaceSlug, projectId, issueId, versionId),
              }}
              handleRestore={(descriptionHTML) => editorRef.current?.setEditorValue(descriptionHTML, true)}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          )}
        </div>
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
