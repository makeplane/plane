/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ArrowRightLeft, UserMinus, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceStaff } from "@/hooks/store";
import { DepartmentTreeSelect } from "./department-tree-select";

type Props = {
  staffId: string;
  onEdit: () => void;
};

export const StaffActionButtons = observer(function StaffActionButtons({ staffId, onEdit }: Props) {
  const { transferStaff, deactivateStaff, deleteStaff } = useInstanceStaff();
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cross-workspace confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeptId, setPendingDeptId] = useState<string | null>(null);
  const [targetWorkspaceName, setTargetWorkspaceName] = useState("");

  const handleDepartmentSelect = async (deptId: string) => {
    setIsLoading(true);
    try {
      const result = await transferStaff(staffId, deptId);
      if ("requires_workspace_transfer" in result && result.requires_workspace_transfer) {
        // Phase 1: cross-workspace detected — show confirm dialog
        setPendingDeptId(deptId);
        setTargetWorkspaceName(result.target_workspace_name);
        setConfirmOpen(true);
      } else {
        const warning = "warning" in result ? (result.warning as string | undefined) : undefined;
        setToast({
          type: warning ? TOAST_TYPE.WARNING : TOAST_TYPE.SUCCESS,
          title: warning ?? "Staff transferred",
        });
      }
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Transfer failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!pendingDeptId) return;
    setConfirmOpen(false);
    setIsLoading(true);
    try {
      // Phase 2: confirmed cross-workspace transfer
      await transferStaff(staffId, pendingDeptId, true);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Staff transferred" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Transfer failed" });
    } finally {
      setIsLoading(false);
      setPendingDeptId(null);
      setTargetWorkspaceName("");
    }
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setPendingDeptId(null);
    setTargetWorkspaceName("");
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
    <div className="flex items-center gap-1">
      <Button variant="secondary" size="sm" onClick={onEdit} disabled={isLoading}>
        Edit
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => setTransferDialogOpen(true)}
        disabled={isLoading}
        title="Transfer to department"
      >
        <ArrowRightLeft className="w-3.5 h-3.5" />
      </Button>

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

      {/* Department picker dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={(open: boolean) => !open && setTransferDialogOpen(false)} modal>
        <Dialog.Panel width={EDialogWidth.MD}>
          <div className="p-6">
            <Dialog.Title>Transfer to Department</Dialog.Title>
            <div className="mt-4">
              <DepartmentTreeSelect
                value=""
                onChange={(id) => {
                  if (!id) return;
                  setTransferDialogOpen(false);
                  void handleDepartmentSelect(id);
                }}
                placeholder="Search and select department..."
              />
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Cross-workspace transfer confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open: boolean) => !open && handleCancelConfirm()} modal>
        <Dialog.Panel width={EDialogWidth.SM}>
          <div className="p-6">
            <Dialog.Title>Transfer to Department</Dialog.Title>
            <p className="mt-4 text-13 text-secondary">
              This staff will be changed to another workspace linked to{" "}
              <span className="font-medium text-primary">{targetWorkspaceName}</span>. Do you want to transfer?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={handleCancelConfirm}>
                No
              </Button>
              <Button variant="primary" size="sm" onClick={() => void handleConfirmTransfer()} disabled={isLoading}>
                Yes
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
});
