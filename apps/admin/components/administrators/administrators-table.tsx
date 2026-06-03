/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, ShieldCheck, Trash2 } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInstanceAdmin } from "@plane/types";
// hooks
import { useAdminManagement, useUser } from "@/hooks/store";
import { PERMISSION_KEYS } from "@/hooks/use-sidebar-menu";
// local components
import { EditAdminMenusDialog } from "./edit-admin-menus-dialog";

export const AdministratorsTable = observer(() => {
  const { admins, adminIds, removeAdmin } = useAdminManagement();
  const { currentUser } = useUser();
  const [editingAdmin, setEditingAdmin] = useState<IInstanceAdmin | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (admin: IInstanceAdmin) => {
    if (!window.confirm(`Remove admin access for ${admin.user_detail?.email}?`)) return;
    setRemovingId(admin.id);
    try {
      await removeAdmin(admin.id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Admin removed" });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not remove admin",
        message: (error as { error?: string })?.error ?? "Please try again.",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const isSelf = (admin: IInstanceAdmin) => admin.user === currentUser?.id;

  return (
    <div className="divide-y divide-subtle rounded-md border border-subtle">
      {adminIds.map((id) => {
        const admin = admins[id];
        if (!admin) return null;
        const menuCount = admin.is_super_admin ? PERMISSION_KEYS.length : (admin.allowed_menus ?? []).length;
        return (
          <div key={id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-13 text-primary">
                <span className="truncate font-medium">
                  {admin.user_detail?.display_name || admin.user_detail?.email}
                </span>
                {admin.is_super_admin && (
                  <span className="flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-11 text-accent-primary">
                    <ShieldCheck className="h-3 w-3" /> Super-admin
                  </span>
                )}
                {isSelf(admin) && <span className="text-11 text-tertiary">(you)</span>}
              </div>
              <div className="truncate text-11 text-tertiary">
                {admin.user_detail?.email} · {menuCount}/{PERMISSION_KEYS.length} menus
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingAdmin(admin)}
                disabled={isSelf(admin) && !currentUser?.is_super_admin}
                aria-label="Edit permissions"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleRemove(admin)}
                disabled={isSelf(admin) || removingId === admin.id}
                aria-label="Remove admin"
              >
                <Trash2 className="h-3.5 w-3.5 text-danger-primary" />
              </Button>
            </div>
          </div>
        );
      })}
      {adminIds.length === 0 && <p className="px-4 py-6 text-13 text-tertiary">No administrators found.</p>}
      <EditAdminMenusDialog admin={editingAdmin} onClose={() => setEditingAdmin(null)} />
    </div>
  );
});
