/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { Dialog, DialogContent } from "@makeplane/propel/components/dialog";
// local imports
import { InboxIssueCreateRoot } from "./create-root";

type TInboxIssueCreateModalRoot = {
  workspaceSlug: string;
  projectId: string;
  modalState: boolean;
  handleModalClose: () => void;
};

export function InboxIssueCreateModalRoot(props: TInboxIssueCreateModalRoot) {
  const { workspaceSlug, projectId, modalState, handleModalClose } = props;
  // states
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  // handlers
  const handleDuplicateIssueModal = (value: boolean) => setIsDuplicateModalOpen(value);

  return (
    <Dialog
      open={modalState}
      // The legacy modal passed no `handleClose`, so an outside press never dismissed it, but a
      // window-level Escape listener closed it. Base UI's Escape is now that single Escape path.
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open) {
          handleModalClose();
          setIsDuplicateModalOpen(false);
        }
      }}
    >
      <DialogContent size="lg">
        <InboxIssueCreateRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          handleModalClose={handleModalClose}
          isDuplicateModalOpen={isDuplicateModalOpen}
          handleDuplicateIssueModal={handleDuplicateIssueModal}
        />
      </DialogContent>
    </Dialog>
  );
}
