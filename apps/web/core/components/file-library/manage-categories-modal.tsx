/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Check, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TFileCategory } from "@plane/types";
import { AlertModalCore, EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
};

export const ManageCategoriesModal = observer(function ManageCategoriesModal(props: Props) {
  const { workspaceSlug, isOpen, onClose } = props;
  const { t } = useTranslation();
  // store
  const { categoryIds, getCategoryById, createCategory, updateCategory, deleteCategory } = useFileLibrary();
  // states
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TFileCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await createCategory(workspaceSlug, { name });
      setNewName("");
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.name?.[0] ?? error?.error ?? t("file_library.categories.create_failed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = async (categoryId: string) => {
    const name = editingName.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await updateCategory(workspaceSlug, categoryId, { name });
      setEditingId(null);
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.name?.[0] ?? error?.error ?? t("file_library.categories.update_failed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await deleteCategory(workspaceSlug, deleteTarget.id);
      setDeleteTarget(null);
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.error ?? t("file_library.categories.delete_failed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AlertModalCore
        isOpen={deleteTarget !== null}
        handleClose={() => setDeleteTarget(null)}
        handleSubmit={handleDelete}
        isSubmitting={isSubmitting}
        title={t("file_library.categories.delete_title", { name: deleteTarget?.name ?? "" })}
        content={t("file_library.categories.delete_description")}
      />
      <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
        <div className="space-y-4 p-5">
          <h3 className="text-16 font-medium">{t("file_library.categories.manage_title")}</h3>

          {/* create */}
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
              }}
              placeholder={t("file_library.categories.new_placeholder")}
              className="w-full"
            />
            <Button variant="primary" size="lg" onClick={handleCreate} disabled={isSubmitting || !newName.trim()}>
              <Plus className="size-3.5" />
              {t("file_library.categories.add")}
            </Button>
          </div>

          {/* list */}
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {categoryIds.map((categoryId) => {
              const category = getCategoryById(categoryId);
              if (!category) return null;
              const isEditing = editingId === category.id;
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-2 rounded-sm border border-subtle px-3 py-2"
                >
                  {isEditing ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleRename(category.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-full"
                      // Focus programmatically on mount (this input only renders once editing
                      // starts) instead of the autoFocus attribute, which jsx-a11y flags because
                      // it can disorient screen-reader users on page load — not a concern here.
                      ref={(element) => element?.focus()}
                    />
                  ) : (
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate text-13 font-medium">{category.name}</span>
                      <span className="text-11 text-tertiary">
                        {t("file_library.categories.file_count", { count: category.file_count })}
                      </span>
                      {category.pdf_only && <span className="text-11 text-tertiary">· PDF</span>}
                    </div>
                  )}
                  <div className="flex shrink-0 items-center gap-1">
                    {category.is_default ? (
                      <Tooltip tooltipContent={t("file_library.categories.default_protected")}>
                        <span className="p-1 text-placeholder">
                          <Lock className="size-3.5" />
                        </span>
                      </Tooltip>
                    ) : isEditing ? (
                      <>
                        <button
                          type="button"
                          className="rounded-sm p-1 hover:bg-layer-1-hover"
                          onClick={() => void handleRename(category.id)}
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded-sm p-1 hover:bg-layer-1-hover"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="size-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="rounded-sm p-1 hover:bg-layer-1-hover"
                          onClick={() => {
                            setEditingId(category.id);
                            setEditingName(category.name);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded-sm p-1 text-danger-primary hover:bg-layer-1-hover"
                          onClick={() => setDeleteTarget(category)}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="lg" onClick={onClose}>
              {t("close")}
            </Button>
          </div>
        </div>
      </ModalCore>
    </>
  );
});
