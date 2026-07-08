/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import useSWR from "swr";
import { Check, Download, Files, FolderPlus, Layers, Tags, Trash2, Upload } from "lucide-react";
// plane imports
import type { FileSystemFileItem, FileSystemItem } from "@plane/extend-ui";
import { FileSystem } from "@plane/extend-ui";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Popover } from "@plane/propel/popover";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { AlertModalCore, Breadcrumbs } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";
// local imports
import { BulkActionsModal } from "./bulk-actions-modal";
import type { TPreviewFile } from "./file-preview-modal";
import { FilePreviewModal } from "./file-preview-modal";
import { FolderSelect } from "./shared";
import { UploadModal } from "./upload-modal";

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
    tagIds,
    getTagById,
    folderIds,
    getFolderById,
    getFolderPath,
    getFilteredFileIds,
    getFileById,
    filters,
    setFilters,
    fetchCategories,
    fetchFolders,
    fetchTags,
    fetchFiles,
    createFolder,
    deleteFile,
    addFileCategories,
    removeFileCategory,
    addFileTags,
    removeFileTag,
    getFileDownloadUrl,
    getPresignedViewUrl,
    filesLoader,
  } = useFileLibrary();
  // states
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<TPreviewFile | null>(null);
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPath, setCurrentPath] = useState("");
  const [browseKey, setBrowseKey] = useState(0);
  const [browsePath, setBrowsePath] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);

  // data
  useSWR(`FILE_LIBRARY_CATEGORIES_${workspaceSlug}`, () => fetchCategories(workspaceSlug), { revalidateOnFocus: false });
  useSWR(`FILE_LIBRARY_FOLDERS_${workspaceSlug}`, () => fetchFolders(workspaceSlug), { revalidateOnFocus: false });
  useSWR(`FILE_LIBRARY_TAGS_${workspaceSlug}`, () => fetchTags(workspaceSlug), { revalidateOnFocus: false });
  useSWR(`FILE_LIBRARY_FILES_${workspaceSlug}`, () => fetchFiles(workspaceSlug), { revalidateOnFocus: false });

  // folder path helpers (path string = "A/B/C/")
  const folderPathString = useCallback(
    (folderId: string | null) =>
      getFolderPath(folderId)
        .map((folder) => folder.name)
        .join("/") + (folderId ? "/" : ""),
    [getFolderPath]
  );

  const currentFolderId = useMemo(() => {
    if (!currentPath) return null;
    const match = folderIds.find((id) => folderPathString(id) === currentPath);
    return match ?? null;
  }, [currentPath, folderIds, folderPathString]);

  // dropzone → open the categorization modal instead of uploading directly
  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setPendingUploads(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } = useDropzone({
    onDrop: handleDrop,
    noClick: true,
    noKeyboard: true,
  });

  // manifest: real folders; files live in exactly one folder.
  // Computed inline (no useMemo): the MobX getters are stable references, so a
  // memo would never invalidate when filesMap fills after the initial fetch —
  // the observer re-render is what keeps this fresh.
  const buildItems = (): FileSystemItem[] => {
    const manifest: FileSystemItem[] = [];
    for (const folderId of folderIds) {
      manifest.push({ kind: "folder", path: folderPathString(folderId) });
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
    for (const fileId of getFilteredFileIds()) {
      const file = getFileById(fileId);
      if (!file) continue;
      const prefix = folderPathString(file.folder_id);
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
    return manifest;
  };
  const items = buildItems();

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
    setPreviewFile({ assetId, name: fsFile.name ?? fsFile.path, contentType: fsFile.contentType ?? "" });
  }, []);

  const navigateTo = (path: string) => {
    setBrowsePath(path);
    setCurrentPath(path);
    setBrowseKey((k) => k + 1);
  };

  const selectedFile = selectedAssetId ? getFileById(selectedAssetId) : undefined;

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

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      await createFolder(workspaceSlug, { name, parent: newFolderParent });
      setNewFolderName("");
      setIsNewFolderOpen(false);
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.error ?? t("error") });
    }
  };

  const breadcrumbTrail = getFolderPath(currentFolderId);

  const labelPopover = (
    kind: "categories" | "tags",
    ids: string[],
    getById: (id: string) => { id: string; name: string; pdf_only?: boolean } | undefined,
    assigned: string[],
    onToggle: (id: string) => void
  ) => (
    <Popover>
      <Popover.Button className="flex items-center gap-1 rounded-sm border border-subtle px-2 py-1 text-12 hover:bg-layer-1-hover">
        {kind === "categories" ? <Layers className="size-3.5" /> : <Tags className="size-3.5" />}
        {t(`file_library.${kind}.title`)}
      </Popover.Button>
      <Popover.Panel side="bottom" align="end">
        <div className="max-h-60 w-56 space-y-0.5 overflow-y-auto rounded-md border border-subtle bg-layer-1 p-2 shadow-raised-200">
          {ids.map((id) => {
            const item = getById(id);
            if (!item) return null;
            const isAssigned = assigned.includes(id);
            const isDisabled = Boolean(item.pdf_only) && selectedFile?.attributes.type !== "application/pdf";
            return (
              <button
                key={id}
                type="button"
                disabled={isDisabled}
                title={isDisabled ? t("file_library.categories.pdf_only_hint") : undefined}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-13",
                  isDisabled ? "cursor-not-allowed text-placeholder" : "hover:bg-layer-1-hover"
                )}
                onClick={() => onToggle(id)}
              >
                <span className="truncate">{item.name}</span>
                {isAssigned && <Check className="size-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      </Popover.Panel>
    </Popover>
  );

  return (
    <div className="flex h-full w-full flex-col">
      <UploadModal
        workspaceSlug={workspaceSlug}
        files={pendingUploads}
        onFilesChange={setPendingUploads}
        defaultFolderId={currentFolderId}
        onClose={() => setPendingUploads([])}
      />
      <BulkActionsModal workspaceSlug={workspaceSlug} isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} />
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="primary" size="base" onClick={openFilePicker}>
            <Upload className="size-3.5" />
            {t("file_library.upload.button")}
          </Button>
          <Popover open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
            <Popover.Button className="flex items-center gap-1 rounded-sm border border-subtle px-2 py-1.5 text-12 hover:bg-layer-1-hover">
              <FolderPlus className="size-3.5" />
              {t("file_library.folders.new_button")}
            </Popover.Button>
            <Popover.Panel side="bottom" align="start">
              <div className="w-64 space-y-2 rounded-md border border-subtle bg-layer-1 p-3 shadow-raised-200">
                <FolderSelect value={newFolderParent} onChange={setNewFolderParent} />
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCreateFolder();
                  }}
                  placeholder={t("file_library.folders.new_placeholder")}
                  className="w-full rounded-sm border border-strong bg-transparent px-2 py-1 text-12"
                />
                <Button variant="primary" size="base" className="w-full" onClick={() => void handleCreateFolder()}>
                  {t("file_library.folders.create")}
                </Button>
              </div>
            </Popover.Panel>
          </Popover>
          <Button variant="secondary" size="base" onClick={() => setIsBulkOpen(true)}>
            <Files className="size-3.5" />
            {t("file_library.bulk.button")}
          </Button>
          {/* filters */}
          <select
            className="rounded-sm border border-subtle bg-transparent px-1.5 py-1 text-12"
            value={filters.category ?? ""}
            onChange={(e) => setFilters({ category: e.target.value || undefined })}
          >
            <option value="">{t("file_library.filters.all_categories")}</option>
            {categoryIds.map((id) => (
              <option key={id} value={id}>
                {getCategoryById(id)?.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-sm border border-subtle bg-transparent px-1.5 py-1 text-12"
            value={filters.tag ?? ""}
            onChange={(e) => setFilters({ tag: e.target.value || undefined })}
          >
            <option value="">{t("file_library.filters.all_tags")}</option>
            {tagIds.map((id) => (
              <option key={id} value={id}>
                {getTagById(id)?.name}
              </option>
            ))}
          </select>
        </div>
        {selectedFile && (
          <div className="flex items-center gap-2">
            <span className="max-w-40 truncate text-12 text-tertiary">{selectedFile.attributes.name}</span>
            {labelPopover(
              "categories",
              categoryIds,
              (id) => getCategoryById(id),
              selectedFile.category_ids,
              (id) =>
                void (selectedFile.category_ids.includes(id)
                  ? removeFileCategory(workspaceSlug, selectedFile.id, id)
                  : addFileCategories(workspaceSlug, selectedFile.id, [id])
                ).catch((error: any) =>
                  setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.error ?? t("error") })
                )
            )}
            {labelPopover(
              "tags",
              tagIds,
              (id) => getTagById(id),
              selectedFile.tag_ids,
              (id) =>
                void (selectedFile.tag_ids.includes(id)
                  ? removeFileTag(workspaceSlug, selectedFile.id, id)
                  : addFileTags(workspaceSlug, selectedFile.id, [id])
                ).catch((error: any) =>
                  setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.error ?? t("error") })
                )
            )}
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

      {/* breadcrumbs */}
      <div className="border-b border-subtle px-4 py-1.5">
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <button type="button" onClick={() => navigateTo("")}>
                <BreadcrumbLink label={t("file_library.title")} icon={<Files className="h-3.5 w-3.5 text-tertiary" />} />
              </button>
            }
            isLast={breadcrumbTrail.length === 0}
          />
          {breadcrumbTrail.map((folder, index) => (
            <Breadcrumbs.Item
              key={folder.id}
              component={
                <button type="button" onClick={() => navigateTo(folderPathString(folder.id))}>
                  <BreadcrumbLink label={folder.name} />
                </button>
              }
              isLast={index === breadcrumbTrail.length - 1}
            />
          ))}
        </Breadcrumbs>
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
            key={browseKey}
            items={items}
            title={t("file_library.title")}
            defaultView="icons"
            defaultPath={browsePath}
            className="h-full"
            getFileUrl={getFileUrl}
            onPathChange={setCurrentPath}
            onSelectionChange={handleSelectionChange}
            onFileOpen={handleFileOpen}
          />
        )}
      </div>
    </div>
  );
});
