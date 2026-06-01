/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Shown when the author tries to leave the article editor (Back button or browser
// navigation) while a translation draft has unsaved edits. English-only (admin).
export function DiscardChangesModal({ open, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()} modal>
      <Dialog.Panel width={EDialogWidth.SM}>
        <div className="p-6">
          <Dialog.Title>You have unsaved changes</Dialog.Title>
          <p className="mt-4 text-13 text-secondary">
            Changes you made to this article have not been saved yet. They will be lost if you leave now. Do you really
            want to leave?
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onCancel}>
              Keep editing
            </Button>
            <Button variant="error-fill" type="button" onClick={onConfirm}>
              Leave without saving
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
