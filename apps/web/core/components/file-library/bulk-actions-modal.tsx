/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { FileText, Search } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";
// local imports
import { FolderSelect, LabelChecklist } from "./shared";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
  /** Pre-seeds the file selection (e.g. from the browser's multi-select) */
  initialFileIds?: string[];
};

type TBulkTab = "move" | "categories" | "tags" | "delete";

export const BulkActionsModal = observer(function BulkActionsModal(props: Props) {
  const { workspaceSlug, isOpen, onClose, initialFileIds } = props;
  const { t } = useTranslation();
  const {
    fileIds,
    getFileById,
    categoryIds,
    getCategoryById,
    tagIds,
    getTagById,
    createCategory,
    updateCategory,
    deleteCategory,
    createTag,
    updateTag,
    deleteTag,
    bulkAction,
  } = useFileLibrary();
  // states
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TBulkTab>("move");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [removeMode, setRemoveMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Each open starts from the caller's selection (empty when opened bare)
  useEffect(() => {
    if (isOpen) setSelectedFileIds(initialFileIds ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const visibleFileIds = fileIds.filter((id) => {
    const file = getFileById(id);
    return file && file.attributes.name.toLowerCase().includes(search.toLowerCase());
  });

  const selectedFiles = selectedFileIds.map((id) => getFileById(id)).filter(Boolean);
  const hasNonPdf = selectedFiles.some((f) => f!.attributes.type !== "application/pdf");

  const toggleFile = (id: string) =>
    setSelectedFileIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const categoryItems = categoryIds
    .map((id) => getCategoryById(id))
    .filter(Boolean)
    .map((c) => ({ id: c!.id, name: c!.name, isProtected: c!.is_default, pdfOnly: c!.pdf_only }));
  const tagItems = tagIds
    .map((id) => getTagById(id))
    .filter(Boolean)
    .map((tag) => ({ id: tag!.id, name: tag!.name }));

  const handleApply = async () => {
    if (selectedFileIds.length === 0) return;
    setIsSubmitting(true);
    try {
      if (tab === "move") {
        await bulkAction(workspaceSlug, {
          action: "move",
          file_ids: selectedFileIds,
          folder_id: newFolderName.trim() ? undefined : folderId,
          new_folder_name: newFolderName.trim() || undefined,
          parent_id: newFolderName.trim() ? folderId : undefined,
        });
      } else if (tab === "delete") {
        await bulkAction(workspaceSlug, { action: "delete", file_ids: selectedFileIds });
      } else if (tab === "categories") {
        await bulkAction(workspaceSlug, {
          action: removeMode ? "remove_categories" : "add_categories",
          file_ids: selectedFileIds,
          category_ids: labelIds,
        });
      } else {
        await bulkAction(workspaceSlug, {
          action: removeMode ? "remove_tags" : "add_tags",
          file_ids: selectedFileIds,
          tag_ids: labelIds,
        });
      }
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("success"), message: t("file_library.bulk.applied") });
      setSelectedFileIds([]);
      setLabelIds([]);
      setNewFolderName("");
      if (tab === "delete") onClose();
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.error ?? t("error") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { key: TBulkTab; label: string }[] = [
    { key: "move", label: t("file_library.bulk.move") },
    { key: "categories", label: t("file_library.categories.title") },
    { key: "tags", label: t("file_library.tags.title") },
    { key: "delete", label: t("file_library.delete") },
  ];

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXXXL}>
      <div className="space-y-4 p-5">
        <h3 className="text-16 font-medium">{t("file_library.bulk.title")}</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* file picker */}
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="absolute top-2 left-2 size-3.5 text-tertiary" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("file_library.bulk.search_placeholder")}
                className="h-7 w-full pl-7 text-12"
              />
            </div>
            <div className="flex items-center gap-2 text-11 text-tertiary">
              <button type="button" className="hover:text-primary" onClick={() => setSelectedFileIds(visibleFileIds)}>
                {t("file_library.upload.select_all")}
              </button>
              ·
              <button type="button" className="hover:text-primary" onClick={() => setSelectedFileIds([])}>
                {t("file_library.upload.select_none")}
              </button>
              <span className="ml-auto">{t("file_library.bulk.selected_count", { count: selectedFileIds.length })}</span>
            </div>
            <div className="max-h-72 space-y-0.5 overflow-y-auto rounded-sm border border-subtle p-1.5">
              {visibleFileIds.map((id) => {
                const file = getFileById(id);
                if (!file) return null;
                return (
                  <label key={id} className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-12 hover:bg-layer-1-hover">
                    <input type="checkbox" checked={selectedFileIds.includes(id)} onChange={() => toggleFile(id)} />
                    <FileText className="size-3.5 shrink-0 text-tertiary" />
                    <span className="truncate">{file.attributes.name}</span>
                  </label>
                );
              })}
              {visibleFileIds.length === 0 && <p className="px-1.5 py-1 text-11 text-tertiary">—</p>}
            </div>
          </div>

          {/* action */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {tabs.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`rounded-sm px-2 py-1 text-12 ${tab === option.key ? "bg-accent-subtle text-accent-primary" : "hover:bg-layer-1-hover"}`}
                  onClick={() => {
                    setTab(option.key);
                    setLabelIds([]);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {tab === "move" && (
              <FolderSelect
                value={folderId}
                onChange={setFolderId}
                allowCreate
                newFolderName={newFolderName}
                onNewFolderNameChange={setNewFolderName}
              />
            )}
            {(tab === "categories" || tab === "tags") && (
              <>
                <label className="flex items-center gap-2 text-12">
                  <input type="checkbox" checked={removeMode} onChange={() => setRemoveMode((v) => !v)} />
                  {t("file_library.bulk.remove_mode")}
                </label>
                <LabelChecklist
                  items={tab === "categories" ? categoryItems : tagItems}
                  checkedIds={labelIds}
                  onToggle={(id) => setLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
                  disablePdfOnly={tab === "categories" && !removeMode && hasNonPdf}
                  onCreate={async (name) =>
                    void (tab === "categories"
                      ? await createCategory(workspaceSlug, { name })
                      : await createTag(workspaceSlug, { name }))
                  }
                  onRename={async (id, name) =>
                    void (tab === "categories"
                      ? await updateCategory(workspaceSlug, id, { name })
                      : await updateTag(workspaceSlug, id, { name }))
                  }
                  onDelete={(id) => (tab === "categories" ? deleteCategory(workspaceSlug, id) : deleteTag(workspaceSlug, id))}
                  createPlaceholder={
                    tab === "categories"
                      ? t("file_library.categories.new_placeholder")
                      : t("file_library.tags.new_placeholder")
                  }
                />
              </>
            )}
            {tab === "delete" && <p className="text-12 text-danger-primary">{t("file_library.bulk.delete_warning")}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose} disabled={isSubmitting}>
            {t("close")}
          </Button>
          <Button
            variant={tab === "delete" ? "error-fill" : "primary"}
            size="lg"
            onClick={handleApply}
            loading={isSubmitting}
            disabled={
              isSubmitting ||
              selectedFileIds.length === 0 ||
              ((tab === "categories" || tab === "tags") && labelIds.length === 0)
            }
          >
            {t("file_library.bulk.apply")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
