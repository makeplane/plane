/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import { AlertTriangle, Book, Building2, TriangleAlert } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TCollection, TLogoProps } from "@plane/types";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { useAppRouter } from "@/hooks/use-app-router";
import { useCollection } from "@/plane-web/hooks/store";

type TDeleteMode = "transfer" | "delete-with-pages";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  collectionId: string;
  collectionName: string;
};

function CollectionIcon({ collection }: { collection: TCollection }) {
  if (collection.is_default) {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded bg-[#E4F6E9]">
        <Building2 className="size-3.5 text-[#00A63E]" />
      </span>
    );
  }
  const logoProps = collection.logo_props as TLogoProps | undefined;
  return (
    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-surface-2">
      {logoProps?.in_use ? (
        <Logo logo={logoProps} size={12} type="lucide" />
      ) : (
        <Book className="size-3 text-tertiary" />
      )}
    </span>
  );
}

function CollectionLabel({ collection }: { collection: TCollection }) {
  return (
    <span className="flex items-center gap-2">
      <CollectionIcon collection={collection} />
      <span>{collection.name}</span>
    </span>
  );
}

export const DeleteCollectionModal: FC<Props> = observer(function DeleteCollectionModal({
  isOpen,
  onClose,
  workspaceSlug,
  collectionId,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMode, setDeleteMode] = useState<TDeleteMode>("transfer");
  const [targetCollectionId, setTargetCollectionId] = useState<string>("");
  const router = useAppRouter();
  const collectionStore = useCollection();
  const { t } = useTranslation();

  const pageCount = collectionStore.pageCollectionIdsByCollection.get(collectionId)?.size ?? 0;
  const availableCollections = (collectionStore.workspaceCollections ?? []).filter((c) => c.id !== collectionId);

  const handleClose = () => {
    if (isDeleting) return;
    onClose();
  };

  const handleConfirm = async () => {
    if (isDeleting) return;

    if (deleteMode === "transfer" && !targetCollectionId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message: t("wiki_collections.toasts.target_required"),
      });
      return;
    }

    setIsDeleting(true);
    try {
      if (deleteMode === "transfer") {
        await collectionStore.moveCollectionPages(workspaceSlug, collectionId, targetCollectionId);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: t("wiki_collections.toasts.transferred_deleted"),
        });
      } else {
        await collectionStore.deleteCollection(workspaceSlug, collectionId);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("common.success"),
          message: t("wiki_collections.toasts.deleted_with_pages"),
        });
      }
      onClose();
      router.push(`/${workspaceSlug}/wiki`);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.error.label"),
        message:
          (error as { detail?: string; error?: string })?.detail ??
          (error as { error?: string })?.error ??
          (error instanceof Error ? error.message : t("wiki_collections.toasts.delete_error")),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedCollection = availableCollections.find((c) => c.id === targetCollectionId);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex w-full items-center gap-6">
          <span className="grid place-items-center rounded-full bg-danger-subtle p-4">
            <AlertTriangle className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-18 font-medium">{t("wiki_collections.delete_modal.title")}</h3>
            <p className="mt-1 text-13 text-secondary">
              {t("wiki_collections.delete_modal.page_count", { pageCount })}
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {/* Option 1: Transfer pages */}
          <div
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-subtle px-4 py-3"
            onClick={() => setDeleteMode("transfer")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setDeleteMode("transfer");
            }}
          >
            <input
              type="radio"
              name="delete-mode"
              className="mt-1 cursor-pointer"
              checked={deleteMode === "transfer"}
              onChange={() => setDeleteMode("transfer")}
            />
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-14 font-medium text-primary">{t("wiki_collections.delete_modal.transfer_title")}</p>
              <p className="text-13 text-secondary">{t("wiki_collections.delete_modal.transfer_description")}</p>

              {deleteMode === "transfer" && (
                <div className="mt-2 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                  {/* Warning note */}
                  <div className="flex items-start gap-2 rounded-md bg-warning-subtle px-3 py-2 text-13 text-warning-secondary">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>{t("wiki_collections.delete_modal.transfer_warning")}</span>
                  </div>

                  {/* Collection picker */}
                  <div>
                    <p className="mb-1.5 text-13 font-medium text-primary">
                      {t("wiki_collections.delete_modal.transfer_target_label")}{" "}
                      <span className="text-danger-primary">*</span>
                    </p>
                    <CustomSelect
                      value={targetCollectionId}
                      label={
                        selectedCollection ? (
                          <CollectionLabel collection={selectedCollection} />
                        ) : (
                          <span className="text-placeholder">
                            {t("wiki_collections.delete_modal.transfer_target_placeholder")}
                          </span>
                        )
                      }
                      onChange={(val: string) => setTargetCollectionId(val)}
                      className="w-full"
                      buttonClassName="w-full border border-subtle rounded-md px-3 py-2 text-14 justify-between"
                      input
                      disabled={isDeleting}
                    >
                      {availableCollections.map((collection) => (
                        <CustomSelect.Option key={collection.id} value={collection.id}>
                          <CollectionLabel collection={collection} />
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Option 2: Delete with pages */}
          <div
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-subtle px-4 py-3"
            onClick={() => setDeleteMode("delete-with-pages")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setDeleteMode("delete-with-pages");
            }}
          >
            <input
              type="radio"
              name="delete-mode"
              className="mt-1 cursor-pointer"
              checked={deleteMode === "delete-with-pages"}
              onChange={() => setDeleteMode("delete-with-pages")}
            />
            <div className="flex flex-col gap-1">
              <p className="text-14 font-medium text-primary">
                {t("wiki_collections.delete_modal.delete_with_pages_title")}
              </p>
              <p className="text-13 text-secondary">
                {t("wiki_collections.delete_modal.delete_with_pages_description")}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose} disabled={isDeleting}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="error-fill"
            size="lg"
            onClick={() => void handleConfirm()}
            loading={isDeleting}
            disabled={deleteMode === "transfer" && !targetCollectionId}
          >
            {isDeleting ? t("common.deleting") : t("wiki_collections.delete_modal.submit")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
