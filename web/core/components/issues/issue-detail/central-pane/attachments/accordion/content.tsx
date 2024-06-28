import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { TOAST_TYPE, setPromiseToast, setToast } from "@plane/ui";
// components
import { IssueAttachmentsList, TAttachmentOperations } from "@/components/issues/attachment";
// hooks
import { useEventTracker, useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueAttachmentsAccordionContent: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;

  // store hooks
  const { createAttachment, removeAttachment } = useIssueDetail();
  const { captureIssueEvent } = useEventTracker();

  // handler
  const handleAttachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (data: FormData) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");

          const attachmentUploadPromise = createAttachment(workspaceSlug, projectId, issueId, data);
          setPromiseToast(attachmentUploadPromise, {
            loading: "Uploading attachment...",
            success: {
              title: "Attachment uploaded",
              message: () => "The attachment has been successfully uploaded",
            },
            error: {
              title: "Attachment not uploaded",
              message: () => "The attachment could not be uploaded",
            },
          });

          const res = await attachmentUploadPromise;
          captureIssueEvent({
            eventName: "Issue attachment added",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "attachment",
              change_details: res.id,
            },
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue attachment added",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
          });
        }
      },
      remove: async (attachmentId: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await removeAttachment(workspaceSlug, projectId, issueId, attachmentId);
          setToast({
            message: "The attachment has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Attachment removed",
          });
          captureIssueEvent({
            eventName: "Issue attachment deleted",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "attachment",
              change_details: "",
            },
          });
        } catch (error) {
          captureIssueEvent({
            eventName: "Issue attachment deleted",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "attachment",
              change_details: "",
            },
          });
          setToast({
            message: "The Attachment could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Attachment not removed",
          });
        }
      },
    }),
    [captureIssueEvent, workspaceSlug, projectId, issueId, createAttachment, removeAttachment]
  );
  return (
    <IssueAttachmentsList
      issueId={issueId}
      disabled={disabled}
      handleAttachmentOperations={handleAttachmentOperations}
    />
  );
});
