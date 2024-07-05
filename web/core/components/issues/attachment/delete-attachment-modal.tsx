import { FC, useState } from "react";
// types
import type { TIssueAttachment } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// helper
import { getFileName } from "@/helpers/attachment.helper";
// types
import { TAttachmentOperations } from "./root";

export type TAttachmentOperationsRemoveModal = Exclude<TAttachmentOperations, "create">;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: TIssueAttachment;
  handleAttachmentOperations: TAttachmentOperationsRemoveModal;
};

export const IssueAttachmentDeleteModal: FC<Props> = (props) => {
  const { isOpen, onClose, data, handleAttachmentOperations } = props;
  // states
  const [loader, setLoader] = useState(false);

  const handleClose = () => {
    onClose();
    setLoader(false);
  };

  const handleDeletion = async (assetId: string) => {
    setLoader(true);
    handleAttachmentOperations.remove(assetId).finally(() => handleClose());
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={() => handleDeletion(data.id)}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Delete attachment"
      content={
        <>
          Are you sure you want to delete attachment-{" "}
          <span className="font-bold">{getFileName(data.attributes.name)}</span>? This attachment will be permanently
          removed. This action cannot be undone.
        </>
      }
    />
  );
};
