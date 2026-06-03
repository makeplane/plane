/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInstanceAdmin } from "@plane/types";
// hooks
import { useAdminManagement, useUser } from "@/hooks/store";
// local components
import { MenuPermissionMultiselect } from "./menu-permission-multiselect";

type TProps = {
  admin: IInstanceAdmin | null;
  onClose: () => void;
};

export const EditAdminMenusDialog = observer(({ admin, onClose }: TProps) => {
  const { updateAdmin } = useAdminManagement();
  const { currentUser } = useUser();
  const [menus, setMenus] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callerIsSuper = currentUser?.is_super_admin ?? false;

  useEffect(() => {
    if (admin) {
      setMenus(admin.allowed_menus ?? []);
      setIsSuperAdmin(admin.is_super_admin);
    }
  }, [admin]);

  const handleSubmit = async () => {
    if (!admin) return;
    setIsSubmitting(true);
    try {
      // Non-supers may not touch the super flag — send only menus.
      const payload = callerIsSuper ? { allowed_menus: menus, is_super_admin: isSuperAdmin } : { allowed_menus: menus };
      await updateAdmin(admin.id, payload);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Permissions updated" });
      onClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not update permissions",
        message: (error as { error?: string })?.error ?? "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={admin !== null} onOpenChange={(isOpen: boolean) => !isOpen && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>Edit permissions — {admin?.user_detail?.email}</Dialog.Title>
          <div className="mt-4 space-y-4">
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
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
