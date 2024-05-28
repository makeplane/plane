import { FC } from "react";
// types
import { TIssue } from "@plane/types";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { InboxIssueCreateRoot, InboxIssueEditRoot } from "@/components/inbox/modals/create-edit-modal";

type TInboxIssueCreateEditModalRoot = {
  workspaceSlug: string;
  projectId: string;
  modalState: boolean;
  handleModalClose: () => void;
  issue: Partial<TIssue> | undefined;
  onSubmit?: () => void;
};

export const InboxIssueCreateEditModalRoot: FC<TInboxIssueCreateEditModalRoot> = (props) => {
  const { workspaceSlug, projectId, modalState, handleModalClose, issue, onSubmit } = props;

  return (
    <ModalCore
      isOpen={modalState}
      handleClose={handleModalClose}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXXL}
    >
      {issue && issue?.id ? (
        <InboxIssueEditRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issue.id}
          issue={issue}
          handleModalClose={handleModalClose}
          onSubmit={onSubmit}
        />
      ) : (
        <InboxIssueCreateRoot workspaceSlug={workspaceSlug} projectId={projectId} handleModalClose={handleModalClose} />
      )}
    </ModalCore>
  );
};
