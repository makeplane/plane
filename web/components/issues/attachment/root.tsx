import { FC, useMemo } from "react";
// hooks
import { useIssueDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { IssueAttachmentUpload } from "./attachment-upload";
import { IssueAttachmentsList } from "./attachments-list";

export type TIssueAttachmentRoot = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  is_archived: boolean;
  is_editable: boolean;
};

export type TAttachmentOperations = {
  create: (data: FormData) => Promise<void>;
  remove: (linkId: string) => Promise<void>;
};

export const IssueAttachmentRoot: FC<TIssueAttachmentRoot> = (props) => {
  // props
  const { workspaceSlug, projectId, issueId, is_archived, is_editable } = props;
  // hooks
  const { createAttachment, removeAttachment } = useIssueDetail();
  const { setToastAlert } = useToast();

  const handleAttachmentOperations: TAttachmentOperations = useMemo(
    () => ({
      create: async (data: FormData) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await createAttachment(workspaceSlug, projectId, issueId, data);
          setToastAlert({
            message: "The attachment has been successfully uploaded",
            type: "success",
            title: "Attachment uploaded",
          });
        } catch (error) {
          setToastAlert({
            message: "The attachment could not be uploaded",
            type: "error",
            title: "Attachment not uploaded",
          });
        }
      },
      remove: async (attachmentId: string) => {
        try {
          if (!workspaceSlug || !projectId || !issueId) throw new Error("Missing required fields");
          await removeAttachment(workspaceSlug, projectId, issueId, attachmentId);
          setToastAlert({
            message: "The attachment has been successfully removed",
            type: "success",
            title: "Attachment removed",
          });
        } catch (error) {
          setToastAlert({
            message: "The Attachment could not be removed",
            type: "error",
            title: "Attachment not removed",
          });
        }
      },
    }),
    [workspaceSlug, projectId, issueId, createAttachment, removeAttachment, setToastAlert]
  );

  return (
    <div className="relative py-3 space-y-3">
      <h3 className="text-lg">Attachments</h3>
      <div className="grid  grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <IssueAttachmentUpload
          workspaceSlug={workspaceSlug}
          disabled={is_editable}
          handleAttachmentOperations={handleAttachmentOperations}
        />
        <IssueAttachmentsList handleAttachmentOperations={handleAttachmentOperations} />
      </div>
    </div>
  );
};
