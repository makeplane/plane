/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useState } from "react";
// plane imports
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import useKeypress from "@/hooks/use-keypress";
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
}
