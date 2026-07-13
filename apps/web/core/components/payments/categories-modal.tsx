/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TExpenseCategory } from "@plane/types";
import { AlertModalCore, EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { financeService } from "@/services/finance.service";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  categories: TExpenseCategory[];
  onClose: () => void;
  onChanged: () => void;
};

export function CategoriesModal(props: Props) {
  const { workspaceSlug, isOpen, categories, onClose, onChanged } = props;
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TExpenseCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await financeService.createCategory(workspaceSlug, { name });
      setNewName("");
      onChanged();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("payments.toasts.error"),
        // 409 when the name is taken; the serializer answers with {name: [...]}
        message: error?.name?.[0] ?? t("payments.toasts.duplicate_category"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await financeService.deleteCategory(workspaceSlug, deleteTarget.id);
      setDeleteTarget(null);
      onChanged();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("payments.toasts.error") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AlertModalCore
        isOpen={deleteTarget !== null}
        handleClose={() => setDeleteTarget(null)}
        handleSubmit={() => void handleDelete()}
        isSubmitting={isSubmitting}
        title={t("payments.delete_category_title")}
        content={t("payments.delete_category_description")}
      />

      <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
        <div className="p-4">
          <h3 className="text-15 mb-4 font-medium">{t("payments.manage_categories")}</h3>

          <div className="mb-3 flex items-center gap-2">
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleCreate();
              }}
              placeholder={t("payments.fields.name")}
              className="w-full"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleCreate()}
              disabled={!newName.trim() || isSubmitting}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {categories.length === 0 ? (
            <p className="py-4 text-center text-13 text-tertiary">{t("payments.empty.categories")}</p>
          ) : (
            <ul className="max-h-72 divide-y divide-subtle overflow-y-auto">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-13">{category.name}</p>
                    <p className="text-11 text-tertiary">
                      {t("payments.expense_count", { count: category.expense_count })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(category)}
                    className="rounded-sm p-1 text-tertiary hover:bg-layer-1-hover hover:text-danger-primary"
                    title={t("payments.actions.delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t("close")}
            </Button>
          </div>
        </div>
      </ModalCore>
    </>
  );
}
