"use-client";

import { FC, useState } from "react";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { InboxIssueCreateRoot } from "@/components/inbox/modals/create-modal";
// hooks
import useKeypress from "@/hooks/use-keypress";

type TInboxIssueCreateModalRoot = {
  workspaceSlug: string;
  projectId: string;
  modalState: boolean;
  handleModalClose: () => void;
};

export const InboxIssueCreateModalRoot: FC<TInboxIssueCreateModalRoot> = (props) => {
  const { workspaceSlug, projectId, modalState, handleModalClose } = props;
  // states
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  // handlers
  const handleDuplicateIssueModal = (value: boolean) => setIsDuplicateModalOpen(value);

  useKeypress("Escape", () => {
    if (modalState) {
      handleModalClose();
      setIsDuplicateModalOpen(false);
    }
  });

  return (
    <ModalCore
      isOpen={modalState}
      position={EModalPosition.TOP}
      width={isDuplicateModalOpen ? EModalWidth.VIXL : EModalWidth.XXXXL}
      className="!bg-transparent rounded-lg shadow-none transition-[width] ease-linear"
    >
      <InboxIssueCreateRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        handleModalClose={handleModalClose}
        isDuplicateModalOpen={isDuplicateModalOpen}
        handleDuplicateIssueModal={handleDuplicateIssueModal}
      />
    </ModalCore>
  );
};
