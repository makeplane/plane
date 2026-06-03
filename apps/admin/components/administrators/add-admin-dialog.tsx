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
import type { IAdminUserOption } from "@plane/types";
// hooks
import { useAdminManagement, useUser } from "@/hooks/store";
// local components
import { AdminUserMultiselect } from "./admin-user-multiselect";
import { MenuPermissionMultiselect } from "./menu-permission-multiselect";

type TProps = {
  open: boolean;
  onClose: () => void;
};

export const AddAdminDialog = observer(({ open, onClose }: TProps) => {
  const { createAdmin } = useAdminManagement();
  const { currentUser } = useUser();
  const [users, setUsers] = useState<IAdminUserOption[]>([]);
  const [menus, setMenus] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callerIsSuper = currentUser?.is_super_admin ?? false;
  const submitLabel = users.length === 0 ? "Add admins" : `Add ${users.length} admin${users.length === 1 ? "" : "s"}`;

  const handleClose = () => {
    setUsers([]);
    setMenus([]);
    setIsSuperAdmin(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (users.length === 0) return;
    setIsSubmitting(true);
    // Each picked user gets the same shared grants; one create call per user so
    // existing escalation/duplicate guards run per row. Partial failures are tallied.
    const results = await Promise.allSettled(
      users.map((user) => createAdmin({ email: user.email, allowed_menus: menus, is_super_admin: isSuperAdmin }))
    );
    setIsSubmitting(false);

    const added = results.filter((r) => r.status === "fulfilled").length;
    const skipped = results.length - added;

    if (added === 0) {
      const firstError = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not add admins",
        message: (firstError?.reason as { error?: string })?.error ?? "Please try again.",
      });
      return;
    }

    setToast({
      type: skipped > 0 ? TOAST_TYPE.WARNING : TOAST_TYPE.SUCCESS,
      title: `${added} admin${added > 1 ? "s" : ""} added`,
      message: skipped > 0 ? `${skipped} skipped (already an admin or not eligible).` : "Done.",
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>Add administrators</Dialog.Title>
          <div className="mt-4 space-y-4">
            <div className="space-y-1">
              <p className="text-13 font-medium text-primary">Users</p>
              <AdminUserMultiselect selected={users} onChange={setUsers} />
              <p className="text-13 text-tertiary">Pick one or more active staff members to promote.</p>
            </div>
            {callerIsSuper && (
              <label className="flex items-center gap-2 text-13 text-primary cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                />
                Super-admin (full access, can manage administrators)
              </label>
            )}
            {!isSuperAdmin && (
              <div className="space-y-1">
                <p className="text-13 font-medium text-primary">Visible menus</p>
                <MenuPermissionMultiselect value={menus} onChange={setMenus} />
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSubmit()}
              disabled={users.length === 0 || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? "Adding…" : submitLabel}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
