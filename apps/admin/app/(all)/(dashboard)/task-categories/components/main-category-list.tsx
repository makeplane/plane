/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import type { IMainTaskCategory } from "@plane/types";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceTaskCategory } from "@/hooks/store";

type Props = {
  selectedMainId: string | null;
  onSelect: (id: string) => void;
  onEdit: (cat: IMainTaskCategory) => void;
};

export const MainCategoryList = observer(function MainCategoryList({ selectedMainId, onSelect, onEdit }: Props) {
  const { mainCategoryIds, mainCategories, deleteMainCategory } = useInstanceTaskCategory();

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Delete this main category? All sub categories and work item associations will be affected. This cannot be undone."
      )
    )
      return;
    try {
      await deleteMainCategory(id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Main category deleted" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete main category" });
    }
  };

  if (mainCategoryIds.length === 0) {
    return <div className="text-center py-12 text-tertiary text-13">No main categories yet. Create the first one.</div>;
  }

  return (
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
          {mainCategoryIds.map((id) => {
            const cat = mainCategories[id];
            const isSelected = selectedMainId === id;
            return (
              <tr
                key={id}
                onClick={() => onSelect(id)}
                className={`cursor-pointer transition-colors hover:bg-layer-2 ${isSelected ? "bg-custom-primary-100/10" : ""}`}
              >
                <td className="px-3 py-2 font-medium">
                  <span className={isSelected ? "text-custom-primary-100" : ""}>{cat.name}</span>
                </td>
                <td className="px-3 py-2 text-secondary truncate max-w-[160px]">{cat.description || "—"}</td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${cat.is_active ? "bg-green-500" : "bg-red-400"}`}
                  />
                </td>
                <td className="px-3 py-2 text-center text-secondary">{cat.sort_order}</td>
                <td className="px-3 py-2 text-right">
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(cat)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleDelete(id)}>
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
  );
});
