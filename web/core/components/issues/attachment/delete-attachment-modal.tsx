import { FC, useState } from "react";
import { observer } from "mobx-react";
// types
// ui
import { AlertModalCore } from "@plane/ui";
// helper
import { getFileName } from "@/helpers/attachment.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
// types
import { TAttachmentOperations } from "./root";

export type TAttachmentOperationsRemoveModal = Exclude<TAttachmentOperations, "create">;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  attachmentId: string;
  handleAttachmentOperations: TAttachmentOperationsRemoveModal;
};

export const IssueAttachmentDeleteModal: FC<Props> = observer((props) => {
  const { isOpen, onClose, attachmentId, handleAttachmentOperations } = props;
  // states
  const [loader, setLoader] = useState(false);

  // store hooks
  const {
    attachment: { getAttachmentById },
  } = useIssueDetail();

  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;

  // handlers
  const handleClose = () => {
    onClose();
    setLoader(false);
  };

  const handleDeletion = async (assetId: string) => {
    setLoader(true);
    handleAttachmentOperations.remove(assetId).finally(() => handleClose());
  };

  if (!attachment) return <></>;
  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={() => handleDeletion(attachment.id)}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Delete attachment"
      content={
        <>
          Are you sure you want to delete attachment-{" "}
          <span className="font-bold">{getFileName(attachment.attributes.name)}</span>? This attachment will be
          permanently removed. This action cannot be undone.
        </>
      }
    />
  );
});
