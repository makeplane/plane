/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import type { IJobGrade } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceJobPosition } from "@/hooks/store";

type Props = {
  selectedGradeId: string | null;
  onSelect: (id: string) => void;
  onEdit: (g: IJobGrade) => void;
};

export const JobGradeList = observer(function JobGradeList({ selectedGradeId, onSelect, onEdit }: Props) {
  const { gradeIds, grades, deleteGrade } = useInstanceJobPosition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteGrade(deleteId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Job grade deleted" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete job grade" });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (gradeIds.length === 0) {
    return <div className="text-center py-12 text-tertiary text-13">No job grades yet. Create the first one.</div>;
  }

  return (
    <>
      <div className="rounded-lg border border-subtle bg-layer-1 overflow-hidden">
        <table className="w-full text-13">
          <thead>
            <tr className="border-b border-subtle bg-layer-2">
              <th className="text-left px-3 py-2 font-medium text-secondary">Name</th>
              <th className="text-left px-3 py-2 font-medium text-secondary">Description</th>
              <th className="text-center px-3 py-2 font-medium text-secondary">Active</th>
              <th className="text-center px-3 py-2 font-medium text-secondary">Order</th>
              <th className="text-right px-3 py-2 font-medium text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {gradeIds.map((id) => {
              const g = grades[id];
              const isSelected = selectedGradeId === id;
              return (
                <tr
                  key={id}
                  onClick={() => onSelect(id)}
                  className={`cursor-pointer transition-colors hover:bg-layer-2 ${isSelected ? "bg-custom-primary-100/10" : ""}`}
                >
                  <td className="px-3 py-2 font-medium">
                    <span className={isSelected ? "text-custom-primary-100" : ""}>{g.name}</span>
                  </td>
                  <td className="px-3 py-2 text-secondary truncate max-w-[160px]">{g.description || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`text-11 px-2 py-0.5 rounded font-medium ${g.is_active ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-500"}`}
                    >
                      {g.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-secondary">{g.sort_order}</td>
                  <td className="px-3 py-2 text-right">
                    <div
                      role="presentation"
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm" onClick={() => onEdit(g)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(id)}>
                        <Trash2 className="w-3.5 h-3.5 text-danger-primary" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} modal>
        <Dialog.Panel width={EDialogWidth.SM}>
          <div className="p-6">
            <Dialog.Title>Delete Job Grade</Dialog.Title>
            <p className="mt-3 text-13 text-secondary">
              Are you sure you want to delete this job grade? All associated job positions will also be deleted. This
              cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button variant="error-fill" size="sm" onClick={() => void confirmDelete()} loading={isDeleting}>
                Delete
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
});
