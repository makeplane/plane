/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ArrowRightLeft, UserMinus, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceStaff, useInstanceDepartment } from "@/hooks/store";

type Props = {
  staffId: string;
  onEdit: () => void;
};

export const StaffActionButtons = observer(function StaffActionButtons({ staffId, onEdit }: Props) {
  const { transferStaff, deactivateStaff, deleteStaff } = useInstanceStaff();
  const { departments, departmentIds } = useInstanceDepartment();
  const [transferOpen, setTransferOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async (deptId: string) => {
    setTransferOpen(false);
    setIsLoading(true);
    try {
      await transferStaff(staffId, deptId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Staff transferred" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Transfer failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate this staff member?")) return;
    setIsLoading(true);
    try {
      await deactivateStaff(staffId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Staff deactivated" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Deactivation failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this staff record? This cannot be undone.")) return;
    setIsLoading(true);
    try {
      await deleteStaff(staffId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Staff deleted" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Delete failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 relative">
      <Button variant="secondary" size="sm" onClick={onEdit} disabled={isLoading}>
        Edit
      </Button>

      {/* Transfer dropdown */}
      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setTransferOpen((v) => !v)}
          disabled={isLoading}
          title="Transfer to department"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
        </Button>
        {transferOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-subtle bg-layer-1 shadow-raised-100 py-1 max-h-40 overflow-auto">
            {departmentIds.length === 0 ? (
              <p className="px-3 py-2 text-12 text-tertiary">No departments</p>
            ) : (
              departmentIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => void handleTransfer(id)}
                  className="w-full px-3 py-1.5 text-left text-13 hover:bg-layer-2 truncate"
                >
                  {departments[id]?.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => void handleDeactivate()}
        disabled={isLoading}
        title="Deactivate"
      >
        <UserMinus className="w-3.5 h-3.5" />
      </Button>

      <Button variant="error-outline" size="sm" onClick={() => void handleDelete()} disabled={isLoading} title="Delete">
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
});
