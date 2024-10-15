import { FC } from "react";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { InboxIssueCreateRoot } from "@/components/inbox/modals/create-modal";

type TInboxIssueCreateModalRoot = {
  workspaceSlug: string;
  projectId: string;
  modalState: boolean;
  handleModalClose: () => void;
};

export const InboxIssueCreateModalRoot: FC<TInboxIssueCreateModalRoot> = (props) => {
  const { workspaceSlug, projectId, modalState, handleModalClose } = props;

  return (
    <ModalCore
      isOpen={modalState}
      handleClose={handleModalClose}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXXL}
    >
      <InboxIssueCreateRoot workspaceSlug={workspaceSlug} projectId={projectId} handleModalClose={handleModalClose} />
    </ModalCore>
  );
};
