/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import type { ISubTaskCategory } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceTaskCategory } from "@/hooks/store";

type Props = {
  selectedMainId: string | null;
  onEdit: (cat: ISubTaskCategory) => void;
  onAddSub: () => void;
};

export const SubCategoryList = observer(function SubCategoryList({ selectedMainId, onEdit, onAddSub }: Props) {
  const { getSubCategoriesByMain, mainCategories, deleteSubCategory } = useInstanceTaskCategory();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteSubCategory(deleteId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Sub category deleted" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete sub category" });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (!selectedMainId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] rounded-lg border border-subtle bg-layer-1">
        <p className="text-secondary text-13">Select a main category to view sub categories.</p>
      </div>
    );
  }

  const subCategories = getSubCategoriesByMain(selectedMainId);
  const mainName = mainCategories[selectedMainId]?.name ?? "";

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-13 font-medium text-secondary">
            Sub categories of <span className="text-primary">{mainName}</span>
          </span>
          <Button variant="primary" size="sm" onClick={onAddSub}>
            Add Sub Category
          </Button>
        </div>

        {subCategories.length === 0 ? (
          <div className="text-center py-10 text-tertiary text-13 rounded-lg border border-subtle bg-layer-1">
            No sub categories yet.
          </div>
        ) : (
          <div className="rounded-lg border border-subtle bg-layer-1 overflow-hidden">
            <table className="w-full text-13">
              <thead>
                <tr className="border-b border-subtle bg-layer-2">
                  <th className="text-left px-3 py-2 font-medium text-secondary">Name</th>
                  <th className="text-center px-3 py-2 font-medium text-secondary">Active</th>
                  <th className="text-center px-3 py-2 font-medium text-secondary">Order</th>
                  <th className="text-right px-3 py-2 font-medium text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {subCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-layer-2 transition-colors">
                    <td className="px-3 py-2 font-medium">{cat.name}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`text-11 px-2 py-0.5 rounded font-medium ${
                          cat.is_active ? "bg-green-500/15 text-green-600" : "bg-red-500/15 text-red-500"
                        }`}
                      >
                        {cat.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-secondary">{cat.sort_order}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(cat)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(cat.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-danger-primary" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} modal>
        <Dialog.Panel width={EDialogWidth.SM}>
          <div className="p-6">
            <Dialog.Title>Delete Sub Category</Dialog.Title>
            <p className="mt-3 text-13 text-secondary">
              Are you sure you want to delete this sub category? This cannot be undone.
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
