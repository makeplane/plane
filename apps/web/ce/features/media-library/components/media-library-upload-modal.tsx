"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileImage,
  FileText,
  FileVideo,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
import { Button, Checkbox } from "@plane/ui";
import { useInstance } from "@/hooks/store/use-instance";
import { useUser } from "@/hooks/store/user";
import { IssueService } from "@/services/issue";
import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaArtifact } from "@/services/media-library.service";
import { ProjectService } from "@/services/project";
import { useMediaLibrary } from "../store/media-library-context";
import { getDocumentThumbnailPath } from "../utils/media-items";
import { MediaLibraryUploadMetaForm } from "./media-library-upload-meta";
import type { TMetaFieldChange, TMetaFormState, TUploadTarget } from "./media-library-upload-types";
import { MediaLibraryWorkItemSelector } from "./media-library-work-item-selector";

const FALLBACK_MEDIA_LIBRARY_MAX_FILE_SIZE = 1024 * 1024 * 1024;
const readMediaLibraryFileSizeLimit = (value: unknown) => {
  const limit = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  return Number.isFinite(limit) && limit > 0 ? limit : null;
};
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

type TUploadStatus = "queued" | "uploading" | "uploaded" | "ready" | "failed" | "cancelled";
type TUploadFailurePhase = "upload";

type TUploadItem = {
  id: string;
  file: File;
  status: TUploadStatus;
  progress: number;
  error?: string;
  artifact?: TMediaArtifact;
  packageId?: string;
  failedPhase?: TUploadFailurePhase;
  abortController?: AbortController;
  retryCount?: number;
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

const isMp4Upload = (file: File) => getFileExtension(file.name) === "mp4" || file.type === "video/mp4";

const isActiveStatus = (status: TUploadStatus) => status === "uploading";

const getVisibleProgress = (item: TUploadItem) => Math.min(100, Math.max(0, item.progress ?? 0));

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const nestedError = record.error;
    if (nestedError && typeof nestedError === "object") {
      const nested = nestedError as Record<string, unknown>;
      if (typeof nested.message === "string" && nested.message.trim()) return nested.message;
      if (typeof nested.code === "string" && nested.code.trim()) return nested.code;
    }
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.error === "string" && record.error.trim()) return record.error;
  }
  return fallback;
};

const getUploadStatusLabel = (item: TUploadItem) => {
  if (item.status === "queued") return "Queued";
  if (item.status === "uploading") return "Uploading...";
  if (item.status === "uploaded") return isMp4Upload(item.file) ? "Uploaded" : "Success";
  if (item.status === "ready") return "Ready";
  if (item.status === "cancelled") return "Cancelled";
  return item.error || "Failed";
};

const isCompletedStatus = (status: TUploadStatus) => status === "uploaded" || status === "ready";

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
  const { isUploadOpen, closeUpload, refreshLibrary, pendingUploadFiles, setPendingUploadFiles, trackTranscodeJob } =
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
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const issueService = useMemo(() => new IssueService(), []);
  const envMaxFileSize = readMediaLibraryFileSizeLimit(process.env.NEXT_PUBLIC_MEDIA_LIBRARY_FILE_SIZE_LIMIT);
  const instanceMaxFileSize = readMediaLibraryFileSizeLimit(
    (config as { media_library_file_size_limit?: number } | undefined)?.media_library_file_size_limit
  );
  const maxFileSize = instanceMaxFileSize ?? envMaxFileSize ?? FALLBACK_MEDIA_LIBRARY_MAX_FILE_SIZE;
  const maxSizeLabel = formatFileSize(maxFileSize);
  const hasActiveUploads = uploads.some((item) => isActiveStatus(item.status));
  const queuedUploads = uploads.filter((item) => item.status === "queued");
  const failedUploads = uploads.filter((item) => item.status === "failed");
  const completedUploads = uploads.filter((item) => isCompletedStatus(item.status));
  const overallProgress = uploads.length
    ? Math.round(uploads.reduce((total, item) => total + getVisibleProgress(item), 0) / uploads.length)
    : 0;
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
    uploads.forEach((item) => {
      item.abortController?.abort();
    });
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
      setUploads((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const duplicateNames: string[] = [];
        const oversizedFiles: Array<{ name: string; size: number }> = [];
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
          if (tooLarge) {
            oversizedFiles.push({ name: file.name, size: file.size });
          }
          nextItems.push({
            id,
            file,
            status: tooLarge || unsupported ? "failed" : "queued",
            progress: 0,
            failedPhase: tooLarge || unsupported ? "upload" : undefined,
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

  const uploadSingle = async (item: TUploadItem, packageId: string, index: number, uploadedAt: number) => {
    const file = item.file;
    const format = resolveArtifactFormat(file.name);
    if (!format) {
      setUploads((prev) =>
        updateUploadEntry(prev, item.id, {
          status: "failed",
          failedPhase: "upload",
          error: "Unsupported file type",
        })
      );
      return false;
    }

    const artifactName = item.artifact?.name || buildArtifactName(file.name, uploadedAt, index);
    const title = getTitleFromFile(file.name) || "Untitled Upload";
    const description = `<p>Uploaded file: ${escapeHtml(title)}</p>`;
    const action = VIDEO_FORMATS.has(format) ? "play" : IMAGE_FORMATS.has(format) ? "view" : "download";
    const meta = buildMetaPayload(metaState, uploadTarget, selectedWorkItem);
    if (DOC_FORMATS.has(format)) {
      meta.kind = "document_file";
      meta.file_size = file.size;
      meta.file_type = file.type || format;
      meta.thumbnail = getDocumentThumbnailPath(format);
    }

    try {
      const abortController = new AbortController();
      setUploads((prev) =>
        updateUploadEntry(prev, item.id, {
          status: "uploading",
          progress: 0,
          error: undefined,
          failedPhase: undefined,
          abortController,
        })
      );
      const artifact = await mediaLibraryService.uploadArtifact(
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
          work_item_id: selectedWorkItem?.id ?? undefined,
        },
        file,
        (progressEvent) => {
          const total = progressEvent.total ?? 0;
          if (!total) return;
          const percent = Math.min(100, Math.round((progressEvent.loaded / total) * 100));
          setUploads((prev) => updateUploadEntry(prev, item.id, { progress: percent, status: "uploading" }));
        },
        { signal: abortController.signal }
      );

      setUploads((prev) =>
        updateUploadEntry(prev, item.id, {
          artifact,
          packageId,
          abortController: undefined,
          progress: 100,
          status: "uploaded",
        })
      );
      refreshLibrary();

      const transcodeJobId = artifact.transcode_job?.job_id;
      if (isMp4Upload(file) && transcodeJobId) {
        trackTranscodeJob({
          workspaceSlug,
          projectId,
          packageId,
          artifactId: artifact.name,
          jobId: transcodeJobId,
        });
      }

      if (isMp4Upload(file) && artifact.transcode_job_error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Background transcoding was not queued",
          message: getErrorMessage(
            artifact.transcode_job_error,
            "The MP4 was uploaded, but transcoding was not queued."
          ),
        });
      }
      return true;
    } catch (error) {
      const wasCancelled =
        error && typeof error === "object" && (error as Record<string, unknown>).code === "ERR_CANCELED";
      setUploads((prev) =>
        updateUploadEntry(prev, item.id, {
          status: wasCancelled ? "cancelled" : "failed",
          failedPhase: wasCancelled ? undefined : "upload",
          abortController: undefined,
          error: wasCancelled ? "Cancelled" : getErrorMessage(error, "Upload failed"),
        })
      );
      return false;
    }
  };

  const handleUpload = async () => {
    const itemsToUpload = uploads.filter((item) => item.status === "queued");
    if (itemsToUpload.length === 0 || !workspaceSlug || !projectId || hasActiveUploads) return;
    const uploadedAt = Date.now();
    let packageId: string | null = null;

    try {
      const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
      packageId = typeof manifest?.id === "string" ? manifest.id : null;
    } catch {
      setUploads((prev) =>
        prev.map((item) =>
          item.status === "queued"
            ? { ...item, status: "failed", failedPhase: "upload", error: "Unable to initialize media library" }
            : item
        )
      );
      return;
    }

    if (!packageId) {
      setUploads((prev) =>
        prev.map((item) =>
          item.status === "queued"
            ? { ...item, status: "failed", failedPhase: "upload", error: "Media library package not available" }
            : item
        )
      );
      return;
    }

    const results = await Promise.allSettled(
      itemsToUpload.map((item, index) => uploadSingle(item, packageId, index, uploadedAt))
    );
    const successCount = results.filter(
      (result): result is PromiseFulfilledResult<boolean> => result.status === "fulfilled" && result.value
    ).length;
    const allUploadsCompleted = successCount === itemsToUpload.length;

    if (successCount > 0) {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message:
          successCount === 1
            ? "File uploaded. Background transcoding will continue automatically."
            : `${successCount} files uploaded. Background transcoding will continue automatically.`,
      });
    }

    if (allUploadsCompleted) {
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
    }
  };

  const handleRetryUpload = async (item: TUploadItem) => {
    if (hasActiveUploads) return;
    const retryTooLarge = item.file.size > maxFileSize;
    const retryUnsupported = !resolveArtifactFormat(item.file.name);
    if (retryTooLarge || retryUnsupported) {
      setUploads((prev) =>
        updateUploadEntry(prev, item.id, {
          status: "failed",
          failedPhase: "upload",
          progress: 0,
          error: retryTooLarge ? `File exceeds ${maxSizeLabel} limit` : "Unsupported file type",
        })
      );
      return;
    }
    setUploads((prev) =>
      updateUploadEntry(prev, item.id, {
        status: "queued",
        progress: 0,
        error: undefined,
        failedPhase: undefined,
        artifact: undefined,
        packageId: undefined,
        retryCount: (item.retryCount ?? 0) + 1,
      })
    );
  };

  const handleCancelUpload = async (item: TUploadItem) => {
    if (item.status === "queued") {
      setUploads((prev) => updateUploadEntry(prev, item.id, { status: "cancelled", error: "Cancelled" }));
      return;
    }
    if (item.status === "uploading") {
      item.abortController?.abort();
      setUploads((prev) =>
        updateUploadEntry(prev, item.id, {
          status: "cancelled",
          abortController: undefined,
          error: "Cancelled",
        })
      );
      return;
    }
  };

  const handleClearCompleted = () => {
    setUploads((prev) => prev.filter((item) => !isCompletedStatus(item.status) && item.status !== "cancelled"));
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

  const activeIndex = uploads.findIndex((item) => isActiveStatus(item.status) || item.status === "queued");
  const queueSummaryLabel =
    uploads.length === 0
      ? "No file selected"
      : hasActiveUploads
        ? `Uploading ${Math.max(1, activeIndex + 1)} of ${uploads.length}`
        : `${completedUploads.length} of ${uploads.length} completed`;
  const uploadButtonLabel = hasActiveUploads ? "Uploading..." : "Save & Upload";

  if (!isUploadOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 sm:items-center">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 shadow-lg">
        <div className="flex items-center justify-between border-b border-custom-border-200 px-5 py-3.5">
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
            className={`flex min-h-[214px] flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition ${
              isDragging
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
            <div className="mt-2 text-sm font-semibold text-custom-text-100">Drag and drop files here</div>
            <div className="mt-1 text-xs text-custom-text-300">or</div>
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
              <div className="mt-3 inline-flex max-w-full items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-xs font-medium text-red-500">
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

          <div className="mt-4 border-t border-custom-border-200/60 pt-4">
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-100">
              <div className="flex flex-wrap items-center gap-3 border-b border-custom-border-200 px-4 py-3">
                <div className="min-w-[130px] text-xs font-semibold text-custom-text-100">{queueSummaryLabel}</div>
                <div className="h-1.5 min-w-[180px] flex-1 overflow-hidden rounded-full bg-custom-border-200">
                  <div
                    className={`h-full rounded-full transition-[width] ${
                      failedUploads.length > 0 && completedUploads.length === 0
                        ? "bg-red-500"
                        : completedUploads.length === uploads.length && uploads.length > 0
                          ? "bg-green-500"
                          : "bg-custom-primary-100"
                    }`}
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <div className="w-10 text-right text-xs font-medium text-custom-text-200">{overallProgress}%</div>
                {failedUploads.length > 0 ? (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {failedUploads.length} failed
                  </div>
                ) : null}
                {completedUploads.length > 0 ? (
                  <button
                    type="button"
                    className="ml-auto text-xs font-medium text-custom-text-300 hover:text-custom-text-100"
                    onClick={handleClearCompleted}
                  >
                    Clear completed
                  </button>
                ) : null}
              </div>

              <div className="max-h-[32vh] overflow-y-auto sm:max-h-[40vh]">
                {uploads.length === 0 ? (
                  <div className="px-4 py-5 text-center text-xs text-custom-text-300">No file selected</div>
                ) : (
                  uploads.map((item) => {
                    const progress = getVisibleProgress(item);
                    const isFailed = item.status === "failed";
                    const isComplete = isCompletedStatus(item.status);
                    const canCancel = item.status === "queued" || item.status === "uploading";
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 border-b border-custom-border-200 px-4 py-3 last:border-b-0"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                            isFailed
                              ? "border-red-500/40 text-red-500"
                              : isComplete
                                ? "border-green-500/40 text-green-500"
                                : "border-custom-border-200 text-custom-text-300"
                          }`}
                        >
                          {getFileIcon(item.file)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <div className="min-w-0 truncate text-xs font-semibold text-custom-text-100">
                              {item.file.name}
                            </div>
                            <div className="shrink-0 text-[11px] text-custom-text-300">
                              {formatFileSize(item.file.size)}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-custom-border-200">
                              <div
                                className={`h-full rounded-full transition-[width] ${
                                  isFailed ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-custom-primary-100"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div
                              className={`w-9 text-right text-[11px] font-medium ${
                                isFailed ? "text-red-500" : isComplete ? "text-green-500" : "text-custom-primary-100"
                              }`}
                            >
                              {progress}%
                            </div>
                          </div>
                          <div
                            className={`mt-1 flex items-center gap-1.5 text-xs ${
                              isFailed
                                ? "text-red-500"
                                : isComplete
                                  ? "text-green-500"
                                  : item.status === "cancelled"
                                    ? "text-custom-text-300"
                                    : "text-custom-primary-100"
                            }`}
                          >
                            {isFailed ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : isComplete ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Clock3 className="h-3.5 w-3.5" />
                            )}
                            <span className="truncate">{getUploadStatusLabel(item)}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isFailed ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-medium text-custom-primary-100 hover:text-custom-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={hasActiveUploads}
                              onClick={() => handleRetryUpload(item)}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Retry
                            </button>
                          ) : canCancel ? (
                            <button
                              type="button"
                              className="text-xs font-medium text-custom-text-300 hover:text-custom-text-100"
                              onClick={() => handleCancelUpload(item)}
                            >
                              Cancel
                            </button>
                          ) : null}
                          {!isActiveStatus(item.status) ? (
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded border border-transparent text-custom-text-300 hover:border-custom-border-200 hover:text-custom-text-100"
                              aria-label={`Remove ${item.file.name}`}
                              onClick={() => setUploads((prev) => prev.filter((entry) => entry.id !== item.id))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-custom-border-200 px-5 py-3 text-xs text-custom-text-300">
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
              disabled={hasActiveUploads || queuedUploads.length === 0}
            >
              {uploadButtonLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
