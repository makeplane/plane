/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { FileText, Plus, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";
// local imports
import { FolderSelect, LabelChecklist } from "./shared";

const isPdf = (file: File) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

type Props = {
  workspaceSlug: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  defaultFolderId: string | null;
  onClose: () => void;
};

export const UploadModal = observer(function UploadModal(props: Props) {
  const { workspaceSlug, files, onFilesChange, defaultFolderId, onClose } = props;
  const { t } = useTranslation();
  const {
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
    uploadFile,
    bulkAction,
  } = useFileLibrary();
  // states — checked is keyed by File identity so adding/removing files keeps
  // previous choices intact
  const [checkedSet, setCheckedSet] = useState<Set<File>>(new Set());
  const [folderId, setFolderId] = useState<string | null>(defaultFolderId);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [pdfsAsContracts, setPdfsAsContracts] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const prevFilesRef = useRef<File[]>([]);

  // The modal stays mounted; when it (re)opens, start a fresh session with the
  // current folder pre-selected. When files are appended, check the new ones.
  useEffect(() => {
    const prev = prevFilesRef.current;
    prevFilesRef.current = files;
    if (files.length === 0) return;
    if (prev.length === 0) {
      setCheckedSet(new Set(files));
      setFolderId(defaultFolderId);
      setSelectedCategoryIds([]);
      setSelectedTagIds([]);
      setPdfsAsContracts(false);
    } else {
      setCheckedSet((prevSet) => new Set(files.filter((f) => prevSet.has(f) || !prev.includes(f))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const checkedFiles = files.filter((f) => checkedSet.has(f));
  const hasNonPdfChecked = checkedFiles.some((f) => !isPdf(f));

  const contratosId = useMemo(() => {
    const id = categoryIds.find((cid) => getCategoryById(cid)?.is_default);
    return id ?? null;
  }, [categoryIds, getCategoryById]);

  const categoryItems = categoryIds
    .map((id) => getCategoryById(id))
    .filter(Boolean)
    .map((c) => ({ id: c!.id, name: c!.name, isProtected: c!.is_default, pdfOnly: c!.pdf_only }));
  const tagItems = tagIds
    .map((id) => getTagById(id))
    .filter(Boolean)
    .map((tag) => ({ id: tag!.id, name: tag!.name }));

  const toggleIn = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const handleUpload = async () => {
    const toUpload = checkedFiles.map((file) => ({ file }));
    if (toUpload.length === 0) return;

    const uploadedIds: string[] = [];
    const uploadedPdfIds: string[] = [];
    let failed = 0;

    for (let i = 0; i < toUpload.length; i++) {
      const { file } = toUpload[i];
      setProgress(`${i + 1}/${toUpload.length} — ${file.name}`);
      try {
        const uploaded = await uploadFile(workspaceSlug, file, undefined, folderId);
        uploadedIds.push(uploaded.id);
        if (isPdf(file)) uploadedPdfIds.push(uploaded.id);
      } catch (error: any) {
        failed += 1;
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: error?.error ?? t("file_library.upload.failed", { name: file.name }),
        });
      }
    }

    // apply labels after the binaries land (backend skips pdf-only mismatches)
    try {
      const categories = [...selectedCategoryIds];
      if (pdfsAsContracts && contratosId && !categories.includes(contratosId)) categories.push(contratosId);
      if (uploadedIds.length > 0 && categories.length > 0) {
        await bulkAction(workspaceSlug, { action: "add_categories", file_ids: uploadedIds, category_ids: categories });
      }
      if (uploadedIds.length > 0 && selectedTagIds.length > 0) {
        await bulkAction(workspaceSlug, { action: "add_tags", file_ids: uploadedIds, tag_ids: selectedTagIds });
      }
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.error ?? t("error") });
    }

    setProgress(null);
    if (uploadedIds.length > 0) {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("file_library.upload.bulk_success", { count: uploadedIds.length }),
      });
    }
    if (failed === 0) onClose();
  };

  return (
    <ModalCore isOpen={files.length > 0} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXXXL}>
      <div className="space-y-4 p-5">
        <h3 className="text-16 font-medium">{t("file_library.upload.modal_title", { count: files.length })}</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* files */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-12 font-medium text-secondary">{t("file_library.upload.files_section")}</p>
              <div className="flex items-center gap-2 text-11 text-tertiary">
                <button type="button" className="hover:text-primary" onClick={() => setCheckedSet(new Set(files))}>
                  {t("file_library.upload.select_all")}
                </button>
                ·
                <button type="button" className="hover:text-primary" onClick={() => setCheckedSet(new Set())}>
                  {t("file_library.upload.select_none")}
                </button>
                ·
                <button
                  type="button"
                  className="hover:text-primary"
                  onClick={() => setCheckedSet(new Set(files.filter(isPdf)))}
                >
                  {t("file_library.upload.select_pdfs")}
                </button>
              </div>
            </div>
            <div className="max-h-64 space-y-0.5 overflow-y-auto rounded-sm border border-subtle p-1.5">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="group flex items-center gap-2 rounded-sm px-1.5 py-1 text-12 hover:bg-layer-1-hover">
                  <input
                    type="checkbox"
                    checked={checkedSet.has(file)}
                    onChange={() =>
                      setCheckedSet((prev) => {
                        const next = new Set(prev);
                        if (next.has(file)) next.delete(file);
                        else next.add(file);
                        return next;
                      })
                    }
                  />
                  <FileText className="size-3.5 shrink-0 text-tertiary" />
                  <span className="truncate">{file.name}</span>
                  {isPdf(file) && <span className="shrink-0 rounded-sm bg-layer-2 px-1 text-10 text-tertiary">PDF</span>}
                  <button
                    type="button"
                    className="ml-auto hidden shrink-0 p-0.5 text-tertiary group-hover:block hover:text-danger-primary"
                    title={t("file_library.upload.remove_file")}
                    onClick={() => onFilesChange(files.filter((f) => f !== file))}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-12 text-accent-primary hover:bg-layer-1-hover"
                onClick={() => addInputRef.current?.click()}
              >
                <Plus className="size-3.5" />
                {t("file_library.upload.add_more")}
              </button>
              <input
                ref={addInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const extra = Array.from(e.target.files ?? []);
                  if (extra.length > 0) onFilesChange([...files, ...extra]);
                  e.target.value = "";
                }}
              />
            </div>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm border border-subtle px-2 py-1.5 text-12",
                pdfsAsContracts ? "border-accent-strong bg-accent-subtle" : ""
              )}
            >
              <input type="checkbox" checked={pdfsAsContracts} onChange={() => setPdfsAsContracts((v) => !v)} />
              {t("file_library.upload.pdfs_as_contracts")}
            </label>
          </div>

          {/* destination + labels */}
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-12 font-medium text-secondary">{t("file_library.folders.destination")}</p>
              <FolderSelect value={folderId} onChange={setFolderId} />
            </div>
            <div>
              <p className="mb-1 text-12 font-medium text-secondary">{t("file_library.categories.title")}</p>
              <LabelChecklist
                items={categoryItems}
                checkedIds={selectedCategoryIds}
                onToggle={(id) => setSelectedCategoryIds((prev) => toggleIn(prev, id))}
                disablePdfOnly={hasNonPdfChecked}
                onCreate={async (name) => void (await createCategory(workspaceSlug, { name }))}
                onRename={async (id, name) => void (await updateCategory(workspaceSlug, id, { name }))}
                onDelete={(id) => deleteCategory(workspaceSlug, id)}
                createPlaceholder={t("file_library.categories.new_placeholder")}
              />
            </div>
            <div>
              <p className="mb-1 text-12 font-medium text-secondary">{t("file_library.tags.title")}</p>
              <LabelChecklist
                items={tagItems}
                checkedIds={selectedTagIds}
                onToggle={(id) => setSelectedTagIds((prev) => toggleIn(prev, id))}
                onCreate={async (name) => void (await createTag(workspaceSlug, { name }))}
                onRename={async (id, name) => void (await updateTag(workspaceSlug, id, { name }))}
                onDelete={(id) => deleteTag(workspaceSlug, id)}
                createPlaceholder={t("file_library.tags.new_placeholder")}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-12 text-tertiary">{progress ?? ""}</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="lg" onClick={onClose} disabled={progress !== null}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleUpload}
              loading={progress !== null}
              disabled={checkedFiles.length === 0 || progress !== null}
            >
              {t("file_library.upload.confirm", { count: checkedFiles.length })}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
