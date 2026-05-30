/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";

type Props = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

export function DeleteConfirmModal({ open, title, description, onConfirm, onClose }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.SM}>
        <div className="p-6">
          <Dialog.Title>{title}</Dialog.Title>
          <p className="mt-4 text-13 text-secondary">{description}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="error-fill" type="button" loading={isDeleting} onClick={() => void handleConfirm()}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
