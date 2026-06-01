/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createElement } from "react";
import { observer } from "mobx-react";
import { BookOpen, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { LUCIDE_ICONS_LIST } from "@plane/propel/emoji-icon-picker";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IHelpCategory } from "@plane/types";
import { cn } from "@plane/utils";
import { useInstanceHelpCenter } from "@/hooks/store";
import { categoryDisplayName } from "./display-helpers";
import { computeReorderedSortValue } from "./reorder-helper";

const ICON_BY_NAME = new Map(LUCIDE_ICONS_LIST.map((icon) => [icon.name, icon.element]));
const resolveIcon = (name: string) => (name && ICON_BY_NAME.get(name)) || BookOpen;

type Props = {
  selectedCategoryId: string | null;
  onSelect: (id: string) => void;
  onEdit: (category: IHelpCategory) => void;
  onDelete: (category: IHelpCategory) => void;
};

export const CategoryList = observer(function CategoryList({ selectedCategoryId, onSelect, onEdit, onDelete }: Props) {
  const { categoryIds, categories, updateCategory } = useInstanceHelpCenter();
  const ordered = categoryIds.map((id) => categories[id]).filter(Boolean);

  const reorder = async (index: number, direction: -1 | 1) => {
    const sortValue = computeReorderedSortValue(ordered, index, direction);
    if (sortValue === null) return;
    try {
      await updateCategory(ordered[index].id, { sort_order: sortValue });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to reorder category" });
    }
  };

  if (ordered.length === 0) {
    return <p className="py-6 text-center text-13 text-tertiary">No categories yet.</p>;
  }

  return (
    <div className="space-y-1">
      {ordered.map((category, index) => {
        const IconElement = resolveIcon(category.icon);
        const isSelected = category.id === selectedCategoryId;
        return (
          <div
            key={category.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(category.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(category.id)}
            className={cn(
              "group flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-2 cursor-pointer hover:bg-surface-2",
              { "border-accent-strong": isSelected }
            )}
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded bg-surface-2"
              style={category.color ? { color: category.color } : undefined}
            >
              {createElement(IconElement, { className: "size-4" })}
            </span>
            <span className="flex-1 truncate text-13 font-medium text-primary">{categoryDisplayName(category)}</span>
            {!category.is_active && <span className="text-11 text-tertiary">Hidden</span>}
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <IconBtn label="Move up" disabled={index === 0} onClick={() => void reorder(index, -1)}>
                <ChevronUp className="size-3.5" />
              </IconBtn>
              <IconBtn label="Move down" disabled={index === ordered.length - 1} onClick={() => void reorder(index, 1)}>
                <ChevronDown className="size-3.5" />
              </IconBtn>
              <IconBtn label="Edit" onClick={() => onEdit(category)}>
                <Pencil className="size-3.5" />
              </IconBtn>
              <IconBtn label="Delete" onClick={() => onDelete(category)}>
                <Trash2 className="size-3.5 text-danger-primary" />
              </IconBtn>
            </div>
          </div>
        );
      })}
    </div>
  );
});

function IconBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="grid place-items-center rounded p-1 text-tertiary hover:bg-layer-1-hover disabled:opacity-40"
    >
      {children}
    </button>
  );
}
