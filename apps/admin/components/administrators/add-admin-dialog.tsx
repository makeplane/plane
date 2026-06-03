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
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useAdminManagement, useUser } from "@/hooks/store";
// local components
import { MenuPermissionMultiselect } from "./menu-permission-multiselect";

type TProps = {
  open: boolean;
  onClose: () => void;
};

export const AddAdminDialog = observer(({ open, onClose }: TProps) => {
  const { createAdmin } = useAdminManagement();
  const { currentUser } = useUser();
  const [email, setEmail] = useState("");
  const [menus, setMenus] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callerIsSuper = currentUser?.is_super_admin ?? false;

  const handleClose = () => {
    setEmail("");
    setMenus([]);
    setIsSuperAdmin(false);
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createAdmin({ email: email.trim(), allowed_menus: menus, is_super_admin: isSuperAdmin });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Admin added", message: `${email.trim()} is now an admin.` });
      handleClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not add admin",
        message: (error as { error?: string })?.error ?? "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>Add administrator</Dialog.Title>
          <div className="mt-4 space-y-4">
            <div className="space-y-1">
              <label htmlFor="admin-email" className="block text-13 font-medium text-primary">
                Email of an existing user
              </label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                className="w-full bg-layer-2"
              />
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
              disabled={!email.trim() || isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? "Adding…" : "Add admin"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
