import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail } from "hooks/store";
// components
import { IssueAttachmentsDetail } from "./attachment-detail";
// types
import { TAttachmentOperations } from "./root";

export type TAttachmentOperationsRemoveModal = Exclude<TAttachmentOperations, "create">;

export type TIssueAttachmentsList = {
  handleAttachmentOperations: TAttachmentOperationsRemoveModal;
};

export const IssueAttachmentsList: FC<TIssueAttachmentsList> = observer((props) => {
  const { handleAttachmentOperations } = props;
  // store hooks
  const {
    attachment: { issueAttachments },
  } = useIssueDetail();

  return (
    <>
      {issueAttachments &&
        issueAttachments.length > 0 &&
        issueAttachments.map((attachmentId) => (
          <IssueAttachmentsDetail attachmentId={attachmentId} handleAttachmentOperations={handleAttachmentOperations} />
        ))}
    </>
  );
});
