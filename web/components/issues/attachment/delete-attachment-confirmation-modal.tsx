import { FC, Dispatch, SetStateAction, useState } from "react";
import type { TIssueAttachment } from "@plane/types";
// components
import { DeleteModalCore } from "@/components/core";
// helper
import { getFileName } from "@/helpers/attachment.helper";
// types
import { TAttachmentOperations } from "./root";

export type TAttachmentOperationsRemoveModal = Exclude<TAttachmentOperations, "create">;

type Props = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  data: TIssueAttachment;
  handleAttachmentOperations: TAttachmentOperationsRemoveModal;
};

export const IssueAttachmentDeleteModal: FC<Props> = (props) => {
  const { isOpen, setIsOpen, data, handleAttachmentOperations } = props;
  // state
  const [loader, setLoader] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    setLoader(false);
  };

  const handleDeletion = async (assetId: string) => {
    setLoader(true);
    handleAttachmentOperations.remove(assetId).finally(() => handleClose());
  };

  return (
    <DeleteModalCore
      handleClose={handleClose}
      handleSubmit={() => handleDeletion(data.id)}
      isDeleting={loader}
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
