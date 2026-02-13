"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FileImage, FileText, FileVideo, UploadCloud, X } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
import { Button, Checkbox } from "@plane/ui";
import { useInstance } from "@/hooks/store/use-instance";
import { IssueService } from "@/services/issue";
import { MediaLibraryService } from "@/services/media-library.service";
import { ProjectService } from "@/services/project";
import { useMediaLibrary } from "../state/media-library-context";
import { getDocumentThumbnailPath } from "../utils/media-items";
import { MediaLibraryUploadMetaForm } from "./media-library-upload-meta";
import type { TMetaFieldChange, TMetaFormState, TUploadTarget } from "./media-library-upload-types";
import { MediaLibraryWorkItemSelector } from "./media-library-work-item-selector";


const DEFAULT_MEDIA_LIBRARY_MAX_FILE_SIZE = 1024 * 1024 * 1024;
const IMAGE_FORMATS = new Set([
  "jpg",
  "jpeg",
  "png",
  "svg",
  "webp",
  "gif",
  "bmp",
  "tif",
  "tiff",
  "avif",
  "heic",
  "heif",
]);
const VIDEO_FORMATS = new Set(["mp4", "m3u8"]);
const DOC_FORMATS = new Set(["json", "csv", "pdf", "docx", "xlsx", "pptx", "txt"]);

type TUploadItem = {
  id: string;
  file: File;
  status: "ready" | "uploading" | "failed";
  progress?: number;
  error?: string;
};

const DEFAULT_META: TMetaFormState = {
  category: null,
  createdByMemberId: null,
  sport: null,
  program: null,
  level: null,
  season: null,
  startDate: null,
  startTime: null,
  tags: [],
};

const useDebouncedValue = (value: string, delayMs: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debouncedValue;
};

const getTitleFromFile = (fileName: string) => fileName.replace(/\.[^/.]+$/, "");
const getFileExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase() ?? "";
const buildUploadId = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const buildArtifactName = (fileName: string, uploadedAt: number, index: number) => {
  const base = getTitleFromFile(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  const suffix = `${uploadedAt}-${index}`;
  return base ? `${base}-${suffix}` : `artifact-${suffix}`;
};

const resolveArtifactFormat = (fileName: string) => {
  const extension = getFileExtension(fileName);
  if (IMAGE_FORMATS.has(extension)) return extension;
  if (VIDEO_FORMATS.has(extension)) return extension;
  if (DOC_FORMATS.has(extension)) return extension;
  return "";
};

const updateUploadEntry = (prev: TUploadItem[], id: string, updates: Partial<TUploadItem>): TUploadItem[] =>
  prev.map((item) => (item.id === id ? { ...item, ...updates } : item));

const formatFileSize = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0MB";
  const sizeInMb = value / (1024 * 1024);
  if (sizeInMb >= 1024) {
    const sizeInGb = sizeInMb / 1024;
    return `${sizeInGb.toFixed(sizeInGb >= 10 ? 0 : 1)}GB`;
  }
  return `${sizeInMb.toFixed(0)}MB`;
};

const normalizeInputValue = (value: string | null | undefined) => (value ?? "").trim();
const normalizeTagValue = (value: string) => value.trim();
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const buildMetaPayload = (
  metaState: TMetaFormState,
  uploadTarget: TUploadTarget,
  selectedWorkItem: ISearchIssueResponse | null
) => {
  const meta: Record<string, unknown> = {};
  const fallbackCategory = uploadTarget === "work-item" ? "Work items" : "Uploads";
  const category = normalizeInputValue(metaState.category) || normalizeInputValue(selectedWorkItem?.category);
  const resolvedCategory = category || fallbackCategory;
  if (resolvedCategory) meta.category = resolvedCategory;

  const sport = normalizeInputValue(metaState.sport) || normalizeInputValue(selectedWorkItem?.sport);
  if (sport) meta.sport = sport;

  const program = normalizeInputValue(metaState.program) || normalizeInputValue(selectedWorkItem?.program);
  if (program) meta.program = program;

  const level = normalizeInputValue(metaState.level) || normalizeInputValue(selectedWorkItem?.level);
  if (level) meta.level = level;

  const season = normalizeInputValue(metaState.season) || normalizeInputValue(selectedWorkItem?.year);
  if (season) meta.season = season;

  const createdByMemberId = normalizeInputValue(metaState.createdByMemberId);
  if (createdByMemberId) meta.created_by = createdByMemberId;

  if (metaState.tags.length > 0) meta.tags = metaState.tags;

  const startDate =
    normalizeInputValue(metaState.startDate) ||
    (uploadTarget === "work-item" ? normalizeInputValue(selectedWorkItem?.start_date) : "");
  const startTime =
    normalizeInputValue(metaState.startTime) ||
    (uploadTarget === "work-item" ? normalizeInputValue(selectedWorkItem?.start_time) : "");
  if (startDate) meta.start_date = startDate;
  if (startTime) meta.start_time = startTime;

  meta.source = uploadTarget === "work-item" ? "work_item_upload" : "web";

  return meta;
};

const projectService = new ProjectService();

export const MediaLibraryUploadModal = () => {
  const { isUploadOpen, closeUpload, refreshLibrary } = useMediaLibrary();
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { config } = useInstance();
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<TUploadItem[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [metaState, setMetaState] = useState<TMetaFormState>(DEFAULT_META);
  const [workItemResults, setWorkItemResults] = useState<ISearchIssueResponse[]>([]);
  const [workItemQuery, setWorkItemQuery] = useState("");
  const [isWorkItemSelectorEnabled, setIsWorkItemSelectorEnabled] = useState(false);
  const [isWorkItemLoading, setIsWorkItemLoading] = useState(false);
  const [isWorkItemDetailsLoading, setIsWorkItemDetailsLoading] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState<ISearchIssueResponse | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const debouncedWorkItemQuery = useDebouncedValue(workItemQuery, 300);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const issueService = useMemo(() => new IssueService(), []);
  const maxFileSize =
    (config as { media_library_file_size_limit?: number } | undefined)?.media_library_file_size_limit ??
    DEFAULT_MEDIA_LIBRARY_MAX_FILE_SIZE;
  const maxSizeLabel = formatFileSize(maxFileSize);
  const hasUploading = uploads.some((item) => item.status === "uploading");
  const uploadTarget: TUploadTarget = selectedWorkItem ? "work-item" : "library";
  const isWorkItemMetaLocked = Boolean(selectedWorkItem);

  useEffect(() => {
    if (!isUploadOpen || !workspaceSlug || !projectId || !isWorkItemSelectorEnabled) return;
    let isMounted = true;
    setIsWorkItemLoading(true);
    projectService
      .projectIssuesSearch(workspaceSlug, projectId, {
        search: debouncedWorkItemQuery.trim(),
        workspace_search: false,
      })
      .then((res) => {
        if (!isMounted) return;
        setWorkItemResults(res);
      })
      .catch(() => {
        if (!isMounted) return;
        setWorkItemResults([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsWorkItemLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedWorkItemQuery, isUploadOpen, isWorkItemSelectorEnabled, projectId, workspaceSlug]);

  const mergeIssueIntoMeta = (issueData: Partial<TIssue> | ISearchIssueResponse | null | undefined) => {
    if (!issueData) return;
    const createdByMemberId = "created_by" in issueData ? normalizeInputValue(issueData.created_by) : "";
    setMetaState({
      category: issueData.category ?? "Work items",
      createdByMemberId: createdByMemberId || null,
      sport: issueData.sport ?? null,
      program: issueData.program ?? null,
      level: issueData.level ?? null,
      season: issueData.year ?? null,
      startDate: issueData.start_date ?? null,
      startTime: issueData.start_time ?? null,
      tags: [],
    });
  };

  const handleSelectWorkItem = (issue: ISearchIssueResponse) => {
    setIsWorkItemSelectorEnabled(true);
    setSelectedWorkItem(issue);
    mergeIssueIntoMeta(issue);
    if (!workspaceSlug || !projectId) return;
    void (async () => {
      try {
        setIsWorkItemDetailsLoading(true);
        const details = await issueService.retrieve(workspaceSlug, projectId, issue.id);
        mergeIssueIntoMeta(details);
      } catch {
        // Ignore detail fetch errors; keep search payload values.
      } finally {
        setIsWorkItemDetailsLoading(false);
      }
    })();
  };

  const handleClearWorkItem = () => {
    setSelectedWorkItem(null);
    setWorkItemQuery("");
    setMetaState(DEFAULT_META);
    setTagDraft("");
  };

  const handleClose = () => {
    setUploads([]);
    setIsDragging(false);
    setSelectionError(null);
    setIsWorkItemSelectorEnabled(false);
    setMetaState(DEFAULT_META);
    setSelectedWorkItem(null);
    setWorkItemResults([]);
    setIsWorkItemDetailsLoading(false);
    setWorkItemQuery("");
    setTagDraft("");
    if (inputRef.current) inputRef.current.value = "";
    closeUpload();
  };

  const handleWorkItemSelectorToggle = (isChecked: boolean) => {
    setIsWorkItemSelectorEnabled(isChecked);
    if (!isChecked) handleClearWorkItem();
  };

  const addFiles = (files: File[]) => {
    if (files.length === 0) return;
    const existingIds = new Set(uploads.map((item) => item.id));
    const duplicateNames: string[] = [];
    const nextItems: TUploadItem[] = [];

    files.forEach((file) => {
      const id = buildUploadId(file);
      if (existingIds.has(id)) {
        duplicateNames.push(file.name);
        return;
      }

      existingIds.add(id);
      const tooLarge = file.size > maxFileSize;
      const unsupported = !resolveArtifactFormat(file.name);
      nextItems.push({
        id,
        file,
        status: tooLarge || unsupported ? "failed" : "ready",
        progress: 0,
        error: tooLarge ? `File exceeds ${maxSizeLabel} limit` : unsupported ? "Unsupported file type" : undefined,
      });
    });

    if (duplicateNames.length > 0) {
      setSelectionError(
        duplicateNames.length === 1
          ? `"${duplicateNames[0]}" is already selected.`
          : `${duplicateNames.length} files are already selected.`
      );
    } else {
      setSelectionError(null);
    }

    if (nextItems.length > 0) {
      setUploads((prev) => [...prev, ...nextItems]);
    }
  };

  const handleUpload = async () => {
    const readyItems = uploads.filter((item) => item.status === "ready");
    if (readyItems.length === 0 || !workspaceSlug || !projectId) return;
    const failedItems = uploads.filter((item) => item.status === "failed");
    const uploadedAt = Date.now();
    let packageId: string | null = null;
    const activeWorkItem = selectedWorkItem;

    try {
      const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
      packageId = typeof manifest?.id === "string" ? manifest.id : null;
    } catch {
      setUploads(
        readyItems.map((item) => ({
          ...item,
          status: "failed",
          error: "Unable to initialize media library",
        }))
      );
      return;
    }

    if (!packageId) {
      setUploads(
        readyItems.map((item) => ({
          ...item,
          status: "failed",
          error: "Media library package not available",
        }))
      );
      return;
    }

    const uploadSingle = async (item: TUploadItem, index: number) => {
      const file = item.file;
      const format = resolveArtifactFormat(file.name);
      if (!format) {
        failedItems.push({
          ...item,
          status: "failed",
          error: "Unsupported file type",
        });
        setUploads((prev) => updateUploadEntry(prev, item.id, { status: "failed", error: "Unsupported file type" }));
        return false;
      }

      const artifactName = buildArtifactName(file.name, uploadedAt, index);
      const title = getTitleFromFile(file.name) || "Untitled Upload";
      const description = `<p>Uploaded file: ${escapeHtml(title)}</p>`;
      const action = VIDEO_FORMATS.has(format) ? "play" : IMAGE_FORMATS.has(format) ? "view" : "download";
      const meta = buildMetaPayload(metaState, uploadTarget, activeWorkItem);
      if (DOC_FORMATS.has(format)) {
        meta.kind = "document_file";
        meta.file_size = file.size;
        meta.file_type = file.type || format;
        meta.thumbnail = getDocumentThumbnailPath(format);
      }
      try {
        setUploads((prev) => updateUploadEntry(prev, item.id, { status: "uploading", progress: 0 }));
        await mediaLibraryService.uploadArtifact(
          workspaceSlug,
          projectId,
          packageId,
          {
            name: artifactName,
            title,
            description,
            format,
            link: null,
            action,
            meta,
            work_item_id: activeWorkItem?.id ?? undefined,
          },
          file,
          (progressEvent) => {
            const total = progressEvent.total ?? 0;
            if (!total) return;
            const percent = Math.min(100, Math.round((progressEvent.loaded / total) * 100));
            setUploads((prev) => updateUploadEntry(prev, item.id, { progress: percent, status: "uploading" }));
          }
        );
        setUploads((prev) => updateUploadEntry(prev, item.id, { progress: 100 }));
        return true;
      } catch {
        failedItems.push({
          ...item,
          status: "failed",
          error: "Upload failed",
        });
        setUploads((prev) => updateUploadEntry(prev, item.id, { status: "failed", error: "Upload failed" }));
        return false;
      }
    };

    const results = await Promise.allSettled(readyItems.map((item, index) => uploadSingle(item, index)));
    const successCount = results.filter(
      (result): result is PromiseFulfilledResult<boolean> => result.status === "fulfilled" && result.value
    ).length;

    if (successCount > 0) {
      refreshLibrary();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: successCount === 1 ? "File uploaded successfully." : `${successCount} files uploaded successfully.`,
      });
    }
    setUploads(failedItems);
    if (failedItems.length === 0) handleClose();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <FileImage className="h-5 w-5 text-custom-text-300" />;
    if (file.type.startsWith("video/")) return <FileVideo className="h-5 w-5 text-custom-text-300" />;
    return <FileText className="h-5 w-5 text-custom-text-300" />;
  };

  const updateMetaField: TMetaFieldChange = (field, value) => {
    setMetaState((prev) => ({ ...prev, [field]: value }));
  };

  const updateTagDraft = (value: string) => {
    setTagDraft(value);
  };

  const updateMetaTags = (updater: (prev: string[]) => string[]) => {
    setMetaState((prev) => ({ ...prev, tags: updater(prev.tags) }));
  };

  const handleAddTag = (rawValue: string) => {
    const parts = rawValue
      .split(",")
      .map((entry) => normalizeTagValue(entry))
      .filter(Boolean);
    if (parts.length === 0) return;
    updateMetaTags((prev) => {
      const next = [...prev];
      for (const part of parts) {
        const exists = next.some((tag) => tag.toLowerCase() === part.toLowerCase());
        if (!exists) next.push(part);
      }
      return next;
    });
    updateTagDraft("");
  };

  const handleRemoveTag = (value: string) => {
    updateMetaTags((prev) => prev.filter((tag) => tag.toLowerCase() !== value.toLowerCase()));
  };

  const uploadButtonLabel = "Save & upload";

  if (!isUploadOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center">
      <div
        className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-custom-border-200 bg-custom-background-100 shadow-lg`}
      >
        <div className="flex items-center justify-between border-b border-custom-border-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-custom-text-100">Upload Files</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-custom-text-300 hover:text-custom-text-100"
            aria-label="Close upload"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <MediaLibraryUploadMetaForm
            projectId={projectId}
            uploadTarget={uploadTarget}
            workItemSelector={
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-custom-text-200">
                  <Checkbox
                    checked={isWorkItemSelectorEnabled}
                    onClick={() => handleWorkItemSelectorToggle(!isWorkItemSelectorEnabled)}
                    className="size-3.5 !outline-none"
                    iconClassName="size-3"
                  />
                  <span>Import Metadata from the work item</span>
                </label>
                {isWorkItemSelectorEnabled ? (
                  <MediaLibraryWorkItemSelector
                    selectedWorkItem={selectedWorkItem}
                    results={workItemResults}
                    isLoading={isWorkItemLoading}
                    isDetailsLoading={isWorkItemDetailsLoading}
                    workItemQuery={workItemQuery}
                    showCard={false}
                    onSelect={handleSelectWorkItem}
                    onQueryChange={setWorkItemQuery}
                    onClear={handleClearWorkItem}
                  />
                ) : null}
              </div>
            }
            meta={metaState}
            isLocked={isWorkItemMetaLocked}
            onFieldChange={updateMetaField}
            tagDraft={tagDraft}
            onTagDraftChange={updateTagDraft}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />

          <div
            className={`rounded-lg border border-dashed px-4 py-8 text-center transition ${isDragging
                ? "border-custom-primary-100 bg-custom-primary-100/10"
                : "border-custom-border-200 bg-custom-background-90"
              }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              addFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <UploadCloud className="mx-auto h-10 w-10 text-custom-text-300" />
            <div className="mt-2 text-sm font-medium text-custom-text-100">Drag and drop file here</div>
            <div className="mt-1 text-xs text-custom-text-300">or</div>
            <div className="flex justify-center items-center ">
              <Button variant="primary" size="sm" className="mt-3 flex items-center" onClick={() => inputRef.current?.click()}>
                Browse files
              </Button>
            </div>
            {selectionError ? <div className="mt-2 text-xs text-red-500">{selectionError}</div> : null}
            <input
              ref={inputRef}
              type="file"
              accept=".mp4,.m3u8,video/mp4,application/vnd.apple.mpegurl,application/x-mpegurl,image/*,application/pdf,text/csv,application/json,.docx,.xlsx,.pptx,.txt"
              multiple
              className="hidden"
              aria-label="Upload files"
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.currentTarget.value = "";
              }}
            />
          </div>

          <hr className="my-4 border-0 border-t border-custom-border-200/60" />

          <div className="mt-4 rounded-lg border border-custom-border-200">
            <div className="max-h-[32vh] overflow-y-auto sm:max-h-[40vh]">
              {uploads.length === 0 ? (
                <div className="px-4 py-3 text-center text-xs text-custom-text-300">No file selected</div>
              ) : (
                uploads.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-custom-border-200 px-4 py-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(item.file)}
                      <div>
                        <div className="text-xs font-medium text-custom-text-100">
                          {item.file.name}
                          <span className="ml-2 text-[11px] font-normal text-custom-text-300">
                            {item.file.size >= 1024 * 1024
                              ? `${(item.file.size / (1024 * 1024)).toFixed(2)} MB`
                              : `${(item.file.size / 1024).toFixed(2)} KB`}
                          </span>
                        </div>
                        {item.status !== "ready" ? (
                          <div className="text-xs text-custom-text-300">
                            {item.status === "uploading"
                              ? item.progress === 100
                                ? "Success"
                                : `Uploading... ${item.progress ?? 0}%`
                              : item.error}
                          </div>
                        ) : null}
                        {item.status === "uploading" ? (
                          <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-custom-border-200">
                            <div
                              className="h-full rounded-full bg-custom-primary-100 transition-[width]"
                              style={{ width: `${item.progress ?? 0}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === "failed" ? (
                        <Button
                          variant="neutral-primary"
                          size="sm"
                          onClick={() =>
                            setUploads((prev) =>
                              prev.map((entry) =>
                                entry.id === item.id
                                  ? { ...entry, status: "ready", error: undefined, progress: 0 }
                                  : entry
                              )
                            )
                          }
                        >
                          Retry
                        </Button>
                      ) : item.status === "ready" ? null : (
                        <div className="text-xs text-custom-primary-100">
                          {item.progress === 100 ? "Success" : "Uploading"}
                        </div>
                      )}
                      <Button
                        variant="neutral-primary"
                        size="sm"
                        disabled={item.status === "uploading"}
                        onClick={() => setUploads((prev) => prev.filter((entry) => entry.id !== item.id))}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <hr className="my-4 border-0 border-t border-custom-border-200/60" />

          {/* Uploaded files list hidden by request */}
        </div>

        <div className="flex items-center justify-between border-t border-custom-border-200 px-5 py-3 text-xs text-custom-text-300">
          <span>
            Supported formats: MP4,HLS,JPEG,PNG,PDF,CSV,XLSX(Max
            size: {maxSizeLabel})
          </span>
          <div className="flex items-center gap-3">
            <Button variant="neutral-primary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              disabled={
                hasUploading ||
                !uploads.some((item) => item.status === "ready")
              }
            >
              {uploadButtonLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
