import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useInitiativeAttachments } from "@/plane-web/hooks/store";
// local components
import { InitiativeAttachmentsDetail } from "./attachment-detail";
import { InitiativeAttachmentsUploadDetails } from "./attachment-upload-details";
import { TAttachmentHelpers } from "./use-attachments";

type TInitiativeAttachmentsList = {
  initiativeId: string;
  attachmentHelpers: TAttachmentHelpers;
  disabled?: boolean;
};

export const InitiativeAttachmentsList: FC<TInitiativeAttachmentsList> = observer((props) => {
  const { initiativeId, attachmentHelpers, disabled } = props;
  // store hooks
  const { getAttachmentsByInitiativeId } = useInitiativeAttachments();
  // derived values
  const { snapshot: attachmentSnapshot } = attachmentHelpers;
  const { uploadStatus } = attachmentSnapshot;
  const initiativeAttachments = getAttachmentsByInitiativeId(initiativeId);

  return (
    <>
      {uploadStatus?.map((uploadStatus) => (
        <InitiativeAttachmentsUploadDetails key={uploadStatus.id} uploadStatus={uploadStatus} />
      ))}
      {initiativeAttachments?.map((attachmentId: string) => (
        <InitiativeAttachmentsDetail
          key={attachmentId}
          attachmentId={attachmentId}
          disabled={disabled}
          attachmentHelpers={attachmentHelpers}
        />
      ))}
    </>
  );
});
