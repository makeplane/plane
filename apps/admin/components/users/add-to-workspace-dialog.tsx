/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useInstanceUser, useWorkspace } from "@/hooks/store";

const ROLES = [
  { value: 20, label: "Admin" },
  { value: 15, label: "Member" },
  { value: 5, label: "Guest" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  existingWorkspaceIds: string[];
};

export const AddToWorkspaceDialog = observer(function AddToWorkspaceDialog({
  open,
  onClose,
  userId,
  existingWorkspaceIds,
}: Props) {
  const { addUserToWorkspace } = useInstanceUser();
  const { workspaces, workspaceIds } = useWorkspace();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedRole, setSelectedRole] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableWorkspaces = workspaceIds
    .filter((id) => !existingWorkspaceIds.includes(id))
    .map((id) => workspaces[id])
    .filter(Boolean);

  const handleSubmit = async () => {
    if (!selectedWorkspaceId) return;
    setIsSubmitting(true);
    try {
      await addUserToWorkspace(userId, selectedWorkspaceId, selectedRole);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "User added to workspace" });
      handleClose();
    } catch (err) {
      const error = err as Record<string, string>;
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: error?.error || "Failed to add to workspace" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedWorkspaceId("");
    setSelectedRole(15);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>Add to Workspace</Dialog.Title>
          <div className="mt-4 space-y-4">
            <div className="space-y-1">
              <label htmlFor="workspace-select" className="block text-13 font-medium text-color-primary">
                Workspace
              </label>
              <select
                id="workspace-select"
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className="w-full rounded-md border border-color-subtle bg-layer-2 px-3 py-2 text-13"
              >
                <option value="">Select a workspace</option>
                {availableWorkspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.slug})
                  </option>
                ))}
              </select>
              {availableWorkspaces.length === 0 && (
                <p className="text-11 text-color-tertiary">User is already a member of all workspaces.</p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="role-select" className="block text-13 font-medium text-color-primary">
                Role
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(Number(e.target.value))}
                className="w-full rounded-md border border-color-subtle bg-layer-2 px-3 py-2 text-13"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSubmit()}
              loading={isSubmitting}
              disabled={!selectedWorkspaceId}
            >
              Add
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
