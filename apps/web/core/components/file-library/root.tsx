/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import useSWR from "swr";
import { Check, Download, FolderCog, Tags, Trash2, Upload } from "lucide-react";
// plane imports
import type { FileSystemFileItem, FileSystemItem } from "@plane/extend-ui";
import { FileSystem } from "@plane/extend-ui";
import type { TPreviewFile } from "./file-preview-modal";
import { FilePreviewModal } from "./file-preview-modal";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Popover } from "@plane/propel/popover";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";
// local imports
import { ManageCategoriesModal } from "./manage-categories-modal";

type Props = {
  workspaceSlug: string;
};

export const FileLibraryRoot = observer(function FileLibraryRoot(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  // store
  const {
    categoryIds,
    getCategoryById,
    fileIds,
    getFileById,
    fetchCategories,
    fetchFiles,
    uploadFile,
    deleteFile,
    addFileCategories,
    removeFileCategory,
    getFileDownloadUrl,
    getPresignedViewUrl,
    filesLoader,
  } = useFileLibrary();
  // states
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<TPreviewFile | null>(null);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // data
  useSWR(`FILE_LIBRARY_CATEGORIES_${workspaceSlug}`, () => fetchCategories(workspaceSlug), {
    revalidateOnFocus: false,
  });
  useSWR(`FILE_LIBRARY_FILES_${workspaceSlug}`, () => fetchFiles(workspaceSlug), {
    revalidateOnFocus: false,
  });

  // upload
  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setIsUploading(true);
      // Uploads run in parallel — each file goes straight to storage via its own
      // presigned URL, so they don't contend with each other, and one failing
      // shouldn't block or delay the rest.
      await Promise.allSettled(
        acceptedFiles.map(async (file) => {
          try {
            await uploadFile(workspaceSlug, file);
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: t("success"),
              message: t("file_library.upload.success", { name: file.name }),
            });
          } catch (error: any) {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("error"),
              message: error?.error ?? t("file_library.upload.failed", { name: file.name }),
            });
          }
        })
      );
      setIsUploading(false);
    },
    [workspaceSlug, uploadFile, t]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFilePicker,
  } = useDropzone({
    onDrop: handleDrop,
    noClick: true,
    noKeyboard: true,
  });

  // manifest: categories are folders; a file appears in every category it
  // belongs to, and at the root when it has none
  const items = useMemo<FileSystemItem[]>(() => {
    const manifest: FileSystemItem[] = [];
    const categoryNameById: Record<string, string> = {};
    for (const categoryId of categoryIds) {
      const category = getCategoryById(categoryId);
      if (!category) continue;
      categoryNameById[categoryId] = category.name;
      manifest.push({ kind: "folder", path: `${category.name}/` });
    }
    const usedPaths = new Set<string>();
    const uniquePath = (base: string) => {
      let candidate = base;
      let counter = 2;
      while (usedPaths.has(candidate)) {
        const dot = base.lastIndexOf(".");
        candidate = dot === -1 ? `${base} (${counter})` : `${base.slice(0, dot)} (${counter})${base.slice(dot)}`;
        counter += 1;
      }
      usedPaths.add(candidate);
      return candidate;
    };
    for (const fileId of fileIds) {
      const file = getFileById(fileId);
      if (!file) continue;
      const parents = file.category_ids.map((id) => categoryNameById[id]).filter(Boolean);
      const targets = parents.length > 0 ? parents.map((name) => `${name}/`) : [""];
      for (const prefix of targets) {
        manifest.push({
          kind: "file",
          path: uniquePath(`${prefix}${file.attributes.name}`),
          name: file.attributes.name,
          contentType: file.attributes.type,
          size: file.size,
          createdAt: file.created_at,
          updatedAt: file.updated_at,
          metadata: { assetId: file.id },
        });
      }
    }
    return manifest;
  }, [categoryIds, fileIds, getCategoryById, getFileById]);

  const getFileUrl = useCallback(
    (file: FileSystemFileItem) => {
      const assetId = file.metadata?.assetId;
      if (!assetId) return "";
      return getPresignedViewUrl(workspaceSlug, assetId);
    },
    [workspaceSlug, getPresignedViewUrl]
  );

  const handleSelectionChange = useCallback((item: FileSystemItem | null) => {
    if (item && item.kind === "file") setSelectedAssetId(item.metadata?.assetId ?? null);
    else setSelectedAssetId(null);
  }, []);

  const handleFileOpen = useCallback((fsFile: FileSystemFileItem) => {
    const assetId = fsFile.metadata?.assetId;
    if (!assetId) return;
    setPreviewFile({
      assetId,
      name: fsFile.name ?? fsFile.path,
      contentType: fsFile.contentType ?? "",
    });
  }, []);

  // selection helpers
  const selectedFile = selectedAssetId ? getFileById(selectedAssetId) : undefined;

  const handleToggleCategory = async (categoryId: string) => {
    if (!selectedFile) return;
    const category = getCategoryById(categoryId);
    try {
      if (selectedFile.category_ids.includes(categoryId)) {
        await removeFileCategory(workspaceSlug, selectedFile.id, categoryId);
      } else {
        await addFileCategories(workspaceSlug, selectedFile.id, [categoryId]);
      }
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.error ?? t("file_library.categories.assign_failed", { name: category?.name ?? "" }),
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    setIsDeleting(true);
    try {
      await deleteFile(workspaceSlug, selectedFile.id);
      setSelectedAssetId(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.error ?? t("file_library.delete_failed") });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <ManageCategoriesModal
        workspaceSlug={workspaceSlug}
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
      />
      <FilePreviewModal workspaceSlug={workspaceSlug} file={previewFile} onClose={() => setPreviewFile(null)} />
      <AlertModalCore
        isOpen={isDeleteModalOpen}
        handleClose={() => setIsDeleteModalOpen(false)}
        handleSubmit={handleDelete}
        isSubmitting={isDeleting}
        title={t("file_library.delete_title", { name: selectedFile?.attributes.name ?? "" })}
        content={t("file_library.delete_description")}
      />

      {/* toolbar */}
      <div className="flex items-center justify-between gap-2 border-b border-subtle px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="primary" size="base" onClick={openFilePicker} loading={isUploading}>
            <Upload className="size-3.5" />
            {t("file_library.upload.button")}
          </Button>
          <Button variant="secondary" size="base" onClick={() => setIsManageCategoriesOpen(true)}>
            <FolderCog className="size-3.5" />
            {t("file_library.categories.manage_button")}
          </Button>
        </div>
        {selectedFile && (
          <div className="flex items-center gap-2">
            <span className="max-w-48 truncate text-12 text-tertiary">{selectedFile.attributes.name}</span>
            <Popover>
              <Popover.Button className="flex items-center gap-1 rounded-sm border border-subtle px-2 py-1 text-12 hover:bg-layer-1-hover">
                <Tags className="size-3.5" />
                {t("file_library.categories.assign_button")}
              </Popover.Button>
              <Popover.Panel side="bottom" align="end">
                <div className="max-h-60 w-56 space-y-0.5 overflow-y-auto rounded-md border border-subtle bg-layer-1 p-2 shadow-raised-200">
                  {categoryIds.map((categoryId) => {
                    const category = getCategoryById(categoryId);
                    if (!category) return null;
                    const isAssigned = selectedFile.category_ids.includes(categoryId);
                    const isPdf = selectedFile.attributes.type === "application/pdf";
                    const isDisabled = category.pdf_only && !isPdf;
                    return (
                      <button
                        key={categoryId}
                        type="button"
                        disabled={isDisabled}
                        title={isDisabled ? t("file_library.categories.pdf_only_hint") : undefined}
                        className={cn(
                          "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-13",
                          isDisabled ? "cursor-not-allowed text-placeholder" : "hover:bg-layer-1-hover"
                        )}
                        onClick={() => void handleToggleCategory(categoryId)}
                      >
                        <span className="truncate">{category.name}</span>
                        {isAssigned && <Check className="size-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </Popover.Panel>
            </Popover>
            <a
              href={getFileDownloadUrl(workspaceSlug, selectedFile.id)}
              className="rounded-sm p-1.5 hover:bg-layer-1-hover"
              title={t("file_library.download")}
            >
              <Download className="size-4" />
            </a>
            <button
              type="button"
              className="rounded-sm p-1.5 text-danger-primary hover:bg-layer-1-hover"
              onClick={() => setIsDeleteModalOpen(true)}
              title={t("file_library.delete")}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* browser + dropzone */}
      <div {...getRootProps()} className="relative h-full min-h-0 w-full">
        <input {...getInputProps()} />
        {isDragActive && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-backdrop">
            <div className="rounded-md border-2 border-dashed border-accent-strong bg-layer-1 px-8 py-6 text-14 font-medium">
              {t("file_library.upload.drop_here")}
            </div>
          </div>
        )}
        {!filesLoader && items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-16 font-medium">{t("file_library.empty.title")}</p>
            <p className="text-13 text-tertiary">{t("file_library.empty.description")}</p>
            <Button variant="primary" size="base" onClick={openFilePicker}>
              <Upload className="size-3.5" />
              {t("file_library.upload.button")}
            </Button>
          </div>
        ) : (
          <FileSystem
            items={items}
            title={t("file_library.title")}
            defaultView="icons"
            className="h-full"
            getFileUrl={getFileUrl}
            onSelectionChange={handleSelectionChange}
            onFileOpen={handleFileOpen}
          />
        )}
      </div>
    </div>
  );
});
