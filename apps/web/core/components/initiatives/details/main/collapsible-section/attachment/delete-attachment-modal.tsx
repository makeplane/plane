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
import { observer } from "mobx-react";
// types
// ui
import { AlertModalCore } from "@plane/ui";
// helper
import { getFileName } from "@plane/utils";
// hooks
import { useInitiativeAttachments } from "@/plane-web/hooks/store";
// types
import type { TAttachmentOperations } from "./use-attachments";

export type TAttachmentOperationsRemoveModal = Pick<TAttachmentOperations, "remove">;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  attachmentId: string;
  attachmentOperations: TAttachmentOperationsRemoveModal;
};

export const InitiativeAttachmentDeleteModal = observer(function InitiativeAttachmentDeleteModal(props: Props) {
  const { isOpen, onClose, attachmentId, attachmentOperations } = props;
  // states
  const [loader, setLoader] = useState(false);

  // store hooks
  const { getAttachmentById } = useInitiativeAttachments();

  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;

  // handlers
  const handleClose = () => {
    onClose();
    setLoader(false);
  };

  const handleDeletion = async (assetId: string) => {
    setLoader(true);
    attachmentOperations.remove(assetId).finally(() => handleClose());
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
