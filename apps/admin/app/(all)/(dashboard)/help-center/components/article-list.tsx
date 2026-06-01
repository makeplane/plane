/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IHelpArticle } from "@plane/types";
import { cn } from "@plane/utils";
import { useInstanceHelpCenter } from "@/hooks/store";
import { articleDisplayTitle } from "./display-helpers";
import { computeReorderedSortValue } from "./reorder-helper";

type Props = {
  selectedCategoryId: string | null;
  onCreate: () => void;
  onEdit: (article: IHelpArticle) => void;
  onDelete: (article: IHelpArticle) => void;
};

export const ArticleList = observer(function ArticleList({ selectedCategoryId, onCreate, onEdit, onDelete }: Props) {
  const { getArticlesByCategory, updateArticle } = useInstanceHelpCenter();
  const ordered = getArticlesByCategory(selectedCategoryId);

  const reorder = async (index: number, direction: -1 | 1) => {
    const sortValue = computeReorderedSortValue(ordered, index, direction);
    if (sortValue === null) return;
    try {
      await updateArticle(ordered[index].id, { sort_order: sortValue });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to reorder article" });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-13 font-medium text-secondary">Articles</span>
        <Button variant="primary" size="sm" onClick={onCreate} disabled={!selectedCategoryId}>
          <Plus className="size-4" />
          New Article
        </Button>
      </div>
      {!selectedCategoryId ? (
        <p className="py-6 text-center text-13 text-tertiary">Select a category to manage its articles.</p>
      ) : ordered.length === 0 ? (
        <p className="py-6 text-center text-13 text-tertiary">No articles in this category yet.</p>
      ) : (
        <div className="space-y-1">
          {ordered.map((article, index) => (
            <div
              key={article.id}
              className="group flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-2"
            >
              <span className="flex-1 truncate text-13 text-primary">{articleDisplayTitle(article)}</span>
              <span
                className={cn("rounded px-1.5 py-0.5 text-11 font-medium", {
                  "bg-success-100 text-success-primary": article.status === "published",
                  "bg-layer-1 text-tertiary": article.status === "draft",
                })}
              >
                {article.status}
              </span>
              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <IconBtn label="Move up" disabled={index === 0} onClick={() => void reorder(index, -1)}>
                  <ChevronUp className="size-3.5" />
                </IconBtn>
                <IconBtn
                  label="Move down"
                  disabled={index === ordered.length - 1}
                  onClick={() => void reorder(index, 1)}
                >
                  <ChevronDown className="size-3.5" />
                </IconBtn>
                <IconBtn label="Edit" onClick={() => onEdit(article)}>
                  <Pencil className="size-3.5" />
                </IconBtn>
                <IconBtn label="Delete" onClick={() => onDelete(article)}>
                  <Trash2 className="size-3.5 text-danger-primary" />
                </IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}
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
      onClick={onClick}
      className="grid place-items-center rounded p-1 text-tertiary hover:bg-layer-1-hover disabled:opacity-40"
    >
      {children}
    </button>
  );
}
