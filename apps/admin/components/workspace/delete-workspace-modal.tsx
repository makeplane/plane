/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { setPromiseToast } from "@plane/propel/toast";
import type { IWorkspace } from "@plane/types";
import { useWorkspace } from "@/hooks/store";

type Props = {
  workspace: IWorkspace;
  isOpen: boolean;
  onClose: () => void;
};

export const DeleteWorkspaceModal = observer(function DeleteWorkspaceModal({ workspace, isOpen, onClose }: Props) {
  const [nameInput, setNameInput] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteWorkspace } = useWorkspace();

  // Both fields must match — mirrors web app delete-workspace-form.tsx
  const canDelete = nameInput === workspace.name && confirmInput === "delete my workspace";

  const handleClose = () => {
    setNameInput("");
    setConfirmInput("");
    onClose();
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    const deletePromise = deleteWorkspace(workspace.id, workspace.slug);
    setPromiseToast(deletePromise, {
      loading: "Deleting workspace...",
      success: { title: "Workspace deleted", message: () => `"${workspace.name}" has been deleted.` },
      error: { title: "Error", message: () => "Failed to delete workspace." },
    });
    await deletePromise
      .then(handleClose)
      .catch(() => {})
      .finally(() => setIsDeleting(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <span className="shrink-0 grid place-items-center rounded-full size-10 bg-danger-subtle text-danger-primary">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-16 font-medium">Delete workspace</h3>
              <p className="text-13 text-secondary">
                You are about to delete <span className="font-medium text-primary">{workspace.name}</span>. All
                projects, issues, and data will be permanently lost.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-13 text-secondary mb-2">
                Type <span className="font-medium text-primary">{workspace.name}</span> to continue.
              </p>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={workspace.name}
                autoComplete="off"
                className="w-full rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13 placeholder:text-placeholder focus:border-accent-primary focus:outline-none"
              />
            </div>
            <div>
              <p className="text-13 text-secondary mb-2">
                For final confirmation, type <span className="font-medium text-primary">delete my workspace</span>{" "}
                below.
              </p>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder=""
                autoComplete="off"
                className="w-full rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13 placeholder:text-placeholder focus:border-accent-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="lg" onClick={handleClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="error-fill" size="lg" onClick={handleDelete} disabled={!canDelete} loading={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete workspace"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
