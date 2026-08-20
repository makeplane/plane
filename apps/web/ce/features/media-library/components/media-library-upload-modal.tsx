"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, FileImage, FileText, FileVideo, Trash2, UploadCloud, X } from "lucide-react";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
import { Button, Checkbox } from "@plane/ui";
import { useInstance } from "@/hooks/store/use-instance";
import { useUser } from "@/hooks/store/user";
import { IssueService } from "@/services/issue";
import { ProjectService } from "@/services/project";
import { useMediaLibrary } from "../store/media-library-context";
import {
  buildUploadId,
  FALLBACK_MEDIA_LIBRARY_MAX_FILE_SIZE,
  formatFileSize,
  getFileExtension,
  readMediaLibraryFileSizeLimit,
  resolveArtifactFormat,
} from "../utils/media-library-upload-jobs";
import { buildUploadTraceId, logMediaUploadLifecycle } from "../utils/upload-progress";
import { MediaLibraryUploadMetaForm } from "./media-library-upload-meta";
import { UPLOAD_MODAL_TEXT_CLASS } from "./media-library-upload-style-classes";
import type { TMetaFieldChange, TMetaFormState, TUploadTarget } from "./media-library-upload-types";
import { MediaLibraryWorkItemSelector } from "./media-library-work-item-selector";

type TPreparedUploadStatus = "selected" | "failed";

type TUploadItem = {
  id: string;
  file: File;
  status: TPreparedUploadStatus;
  uploadId: string;
  error?: string;
};

const createDefaultMeta = (createdByMemberId: string | null = null): TMetaFormState => ({
  category: null,
  createdByMemberId,
  sport: null,
  program: null,
  level: null,
  season: null,
  startDate: null,
  startTime: null,
  tags: [],
});

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

const normalizeInputValue = (value: string | null | undefined) => (value ?? "").trim();
const normalizeTagValue = (value: string) => value.trim();
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
  const { isUploadOpen, closeUpload, pendingUploadFiles, setPendingUploadFiles, enqueueUploadBatch } =
    useMediaLibrary();
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { config } = useInstance();
  const { data: currentUser } = useUser();
  const currentUserId = currentUser?.id ?? null;
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<TUploadItem[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [metaState, setMetaState] = useState<TMetaFormState>(() => createDefaultMeta(currentUserId));
  const [workItemResults, setWorkItemResults] = useState<ISearchIssueResponse[]>([]);
  const [workItemQuery, setWorkItemQuery] = useState("");
  const [isWorkItemSelectorEnabled, setIsWorkItemSelectorEnabled] = useState(false);
  const [isWorkItemLoading, setIsWorkItemLoading] = useState(false);
  const [isWorkItemDetailsLoading, setIsWorkItemDetailsLoading] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState<ISearchIssueResponse | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const debouncedWorkItemQuery = useDebouncedValue(workItemQuery, 300);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const issueService = useMemo(() => new IssueService(), []);
  const envMaxFileSize = readMediaLibraryFileSizeLimit(process.env.NEXT_PUBLIC_MEDIA_LIBRARY_FILE_SIZE_LIMIT);
  const instanceMaxFileSize = readMediaLibraryFileSizeLimit(
    (config as { media_library_file_size_limit?: number } | undefined)?.media_library_file_size_limit
  );
  const maxFileSize = instanceMaxFileSize ?? envMaxFileSize ?? FALLBACK_MEDIA_LIBRARY_MAX_FILE_SIZE;
  const maxSizeLabel = formatFileSize(maxFileSize);
  const readyToUploadItems = uploads.filter((item) => item.status === "selected");
  const failedUploads = uploads.filter((item) => item.status === "failed");
  const uploadTarget: TUploadTarget = selectedWorkItem ? "work-item" : "library";
  const isWorkItemMetaLocked = Boolean(selectedWorkItem);

  useEffect(() => {
    if (!isUploadOpen || !currentUserId || selectedWorkItem) return;
    setMetaState((prev) => (prev.createdByMemberId ? prev : { ...prev, createdByMemberId: currentUserId }));
  }, [currentUserId, isUploadOpen, selectedWorkItem]);

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
    setMetaState(createDefaultMeta(currentUserId));
    setTagDraft("");
  };

  const handleClose = () => {
    setUploads([]);
    setIsDragging(false);
    setSelectionError(null);
    setIsWorkItemSelectorEnabled(false);
    setMetaState(createDefaultMeta(currentUserId));
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

  const addFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;
      const selectedAtMs = Date.now();
      const incomingFiles = files.map((file, index) => {
        const uploadId = buildUploadTraceId({
          fileName: file.name,
          fileSize: file.size,
          lastModified: file.lastModified,
          timestampMs: selectedAtMs + index,
        });
        logMediaUploadLifecycle({
          event: "file_selected",
          uploadId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || getFileExtension(file.name),
        });
        return {
          file,
          id: buildUploadId(file),
          uploadId,
        };
      });
      setUploads((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const duplicateNames: string[] = [];
        const oversizedFiles: Array<{ name: string; size: number }> = [];
        const nextItems: TUploadItem[] = [];

        incomingFiles.forEach(({ file, id, uploadId }) => {
          if (existingIds.has(id)) {
            duplicateNames.push(file.name);
            return;
          }

          existingIds.add(id);
          const tooLarge = file.size > maxFileSize;
          const unsupported = !resolveArtifactFormat(file.name);
          if (tooLarge) {
            oversizedFiles.push({ name: file.name, size: file.size });
          }
          nextItems.push({
            id,
            file,
            uploadId,
            status: tooLarge || unsupported ? "failed" : "selected",
            error: tooLarge ? `File exceeds ${maxSizeLabel} limit` : unsupported ? "Unsupported file type" : undefined,
          });
        });

        if (oversizedFiles.length > 0) {
          const firstOversizedFile = oversizedFiles[0];
          setSelectionError(
            oversizedFiles.length === 1
              ? `"${firstOversizedFile.name}" is ${formatFileSize(
                  firstOversizedFile.size
                )}. Maximum allowed size is ${maxSizeLabel}.`
              : `${oversizedFiles.length} files exceed the ${maxSizeLabel} media library upload limit.`
          );
        } else if (duplicateNames.length > 0) {
          setSelectionError(
            duplicateNames.length === 1
              ? `"${duplicateNames[0]}" is already selected.`
              : `${duplicateNames.length} files are already selected.`
          );
        } else {
          setSelectionError(null);
        }

        return nextItems.length > 0 ? [...prev, ...nextItems] : prev;
      });
    },
    [maxFileSize, maxSizeLabel]
  );

  useEffect(() => {
    if (!isUploadOpen || pendingUploadFiles.length === 0) return;

    addFiles(pendingUploadFiles);
    setPendingUploadFiles([]);
  }, [addFiles, isUploadOpen, pendingUploadFiles, setPendingUploadFiles]);

  const resetSelectionForm = () => {
    setUploads([]);
    setIsDragging(false);
    setSelectionError(null);
    setIsWorkItemSelectorEnabled(false);
    setMetaState(createDefaultMeta(currentUserId));
    setSelectedWorkItem(null);
    setWorkItemResults([]);
    setIsWorkItemDetailsLoading(false);
    setWorkItemQuery("");
    setTagDraft("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = () => {
    const itemsToUpload = uploads.filter((item) => item.status === "selected");
    if (itemsToUpload.length === 0 || !workspaceSlug || !projectId) return;

    enqueueUploadBatch({
      workspaceSlug,
      projectId,
      files: itemsToUpload.map((item) => item.file),
      meta: buildMetaPayload(metaState, uploadTarget, selectedWorkItem),
      workItemId: selectedWorkItem?.id ?? null,
    });
    resetSelectionForm();
    closeUpload();
  };

  const removeSelectedUpload = (itemId: string) => {
    setUploads((prev) => prev.filter((entry) => entry.id !== itemId));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <FileImage className={`h-5 w-5 ${UPLOAD_MODAL_TEXT_CLASS.muted}`} />;
    if (file.type.startsWith("video/")) return <FileVideo className={`h-5 w-5 ${UPLOAD_MODAL_TEXT_CLASS.muted}`} />;
    return <FileText className={`h-5 w-5 ${UPLOAD_MODAL_TEXT_CLASS.muted}`} />;
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

  const queueSummaryLabel =
    uploads.length === 0
      ? "No file selected"
      : uploads.length === 1
        ? "1 file selected"
        : `${uploads.length} files selected`;

  if (!isUploadOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-custom-backdrop p-4 dark:bg-[#0F0F0F]/80 sm:items-center">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-custom-shadow-md dark:border-[#353535] dark:bg-[#151515] dark:shadow-[0_24px_80px_rgba(15,15,15,0.45)]">
        <div className="flex items-center justify-between border-b border-custom-border-200 px-5 py-3.5 dark:border-[#2A2A2A]">
          <h2 className={`text-lg font-bold ${UPLOAD_MODAL_TEXT_CLASS.primary}`}>Upload Files</h2>
          <button
            type="button"
            onClick={handleClose}
            className={UPLOAD_MODAL_TEXT_CLASS.mutedAction}
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
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 text-xs ${UPLOAD_MODAL_TEXT_CLASS.label}`}
                >
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
            className={`flex min-h-[214px] flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition ${
              isDragging
                ? "border-custom-primary-100 bg-custom-primary-100/10 dark:border-[#2D9CDB] dark:bg-[#2D9CDB]/10"
                : "border-custom-border-200 bg-custom-background-90 dark:border-[#303030] dark:bg-[#171717]"
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
            <UploadCloud className={`mx-auto h-10 w-10 ${UPLOAD_MODAL_TEXT_CLASS.muted}`} />
            <div className={`mt-2 text-sm font-normal ${UPLOAD_MODAL_TEXT_CLASS.body}`}>Drag and drop files here</div>
            <div className={`mt-1 text-xs ${UPLOAD_MODAL_TEXT_CLASS.muted}`}>or</div>
            <div className="flex items-center justify-center">
              <Button
                variant="primary"
                size="sm"
                className="mt-3 flex items-center"
                onClick={() => inputRef.current?.click()}
              >
                Browse files
              </Button>
            </div>
            {selectionError ? (
              <div className="mt-3 inline-flex max-w-full items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-xs font-medium text-red-500 dark:border-[#FF3434]/30 dark:bg-[#FF3434]/10 dark:text-[#FF3434]">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{selectionError}</span>
              </div>
            ) : null}
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

          <div className="mt-4 border-t border-custom-border-200/60 pt-4 dark:border-[#2A2A2A]">
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 dark:border-[#303030] dark:bg-[#151515]">
              <div className="flex flex-wrap items-center gap-3 border-b border-custom-border-200 px-4 py-3 dark:border-[#2A2A2A]">
                <div className={`min-w-[130px] text-xs font-normal ${UPLOAD_MODAL_TEXT_CLASS.muted}`}>
                  {queueSummaryLabel}
                </div>
                <div className="min-w-[180px] flex-1" />
                {failedUploads.length > 0 ? (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-[#FF3434]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {failedUploads.length} invalid
                  </div>
                ) : null}
              </div>

              <div className="max-h-[32vh] overflow-y-auto sm:max-h-[40vh]">
                {uploads.length === 0 ? (
                  <div className={`px-4 py-5 text-center text-xs ${UPLOAD_MODAL_TEXT_CLASS.muted}`}>
                    No file selected
                  </div>
                ) : (
                  uploads.map((item) => {
                    const isFailed = item.status === "failed";
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 border-b border-custom-border-200 px-4 py-3 last:border-b-0 dark:border-[#2A2A2A]"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                            isFailed
                              ? "border-red-500/40 text-red-500 dark:border-[#FF3434]/40 dark:text-[#FF3434]"
                              : `border-custom-border-200 ${UPLOAD_MODAL_TEXT_CLASS.muted} dark:border-[#303030]`
                          }`}
                        >
                          {getFileIcon(item.file)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <div className={`min-w-0 truncate text-xs font-semibold ${UPLOAD_MODAL_TEXT_CLASS.body}`}>
                              {item.file.name}
                            </div>
                            <div className={`shrink-0 text-[11px] ${UPLOAD_MODAL_TEXT_CLASS.muted}`}>
                              {formatFileSize(item.file.size)}
                            </div>
                          </div>
                          {isFailed ? (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-red-500 dark:text-[#FF3434]">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span className="truncate">{item.error ?? "Invalid file"}</span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            className={`inline-flex h-7 w-7 items-center justify-center rounded border border-transparent ${UPLOAD_MODAL_TEXT_CLASS.mutedAction} hover:border-custom-border-200 dark:hover:border-[#303030]`}
                            aria-label={`Remove ${item.file.name}`}
                            onClick={() => removeSelectedUpload(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`flex flex-wrap items-center justify-between gap-3 border-t border-custom-border-200 px-5 py-3 text-xs ${UPLOAD_MODAL_TEXT_CLASS.muted} dark:border-[#2A2A2A]`}
        >
          <span>Supported formats: MP4, HLS, JPEG, PNG, PDF, CSV, XLSX (Max size: {maxSizeLabel})</span>
          <div className="flex items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="disabled:!cursor-default disabled:opacity-70"
              onClick={handleUpload}
              disabled={readyToUploadItems.length === 0}
            >
              Save & Upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
