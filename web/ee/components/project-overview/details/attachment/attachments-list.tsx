import { FC } from "react";
import { observer } from "mobx-react";
// hooks
// types
// components
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";
import { ProjectAttachmentsDetail } from "./attachment-detail";
import { ProjectAttachmentsUploadDetails } from "./attachment-upload-details";
import { TAttachmentHelpers } from "./use-attachments";

type TProjectAttachmentsList = {
  projectId: string;
  attachmentHelpers: TAttachmentHelpers;
  disabled?: boolean;
};

export const ProjectAttachmentsList: FC<TProjectAttachmentsList> = observer((props) => {
  const { projectId, attachmentHelpers, disabled } = props;
  // store hooks
  const { getAttachmentsByProjectId } = useProjectAttachments();
  // derived values
  const { snapshot: attachmentSnapshot } = attachmentHelpers;
  const { uploadStatus } = attachmentSnapshot;
  const projectAttachments = getAttachmentsByProjectId(projectId);

  return (
    <>
      {uploadStatus?.map((uploadStatus) => (
        <ProjectAttachmentsUploadDetails key={uploadStatus.id} uploadStatus={uploadStatus} />
      ))}
      {projectAttachments?.map((attachmentId: string) => (
        <ProjectAttachmentsDetail
          key={attachmentId}
          attachmentId={attachmentId}
          disabled={disabled}
          attachmentHelpers={attachmentHelpers}
        />
      ))}
    </>
  );
});
