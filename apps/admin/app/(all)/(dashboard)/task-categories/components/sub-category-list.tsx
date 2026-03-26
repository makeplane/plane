/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import type { ISubTaskCategory } from "@plane/types";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceTaskCategory } from "@/hooks/store";

type Props = {
  selectedMainId: string | null;
  onEdit: (cat: ISubTaskCategory) => void;
  onAddSub: () => void;
};

export const SubCategoryList = observer(function SubCategoryList({ selectedMainId, onEdit, onAddSub }: Props) {
  const { getSubCategoriesByMain, mainCategories, deleteSubCategory } = useInstanceTaskCategory();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this sub category? This cannot be undone.")) return;
    try {
      await deleteSubCategory(id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Sub category deleted" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete sub category" });
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
                      className={`inline-block w-2 h-2 rounded-full ${cat.is_active ? "bg-green-500" : "bg-red-400"}`}
                    />
                  </td>
                  <td className="px-3 py-2 text-center text-secondary">{cat.sort_order}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(cat)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void handleDelete(cat.id)}>
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
  );
});
