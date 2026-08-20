import type { TMediaArtifact } from "@/services/media-library.service";

export const MEDIA_LIBRARY_MAX_FILE_SIZE_5_GB = 5 * 1024 * 1024 * 1024;
export const FALLBACK_MEDIA_LIBRARY_MAX_FILE_SIZE = MEDIA_LIBRARY_MAX_FILE_SIZE_5_GB;

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

export type TMediaLibraryUploadStatus = "queued" | "uploading" | "processing" | "completed" | "failed" | "cancelled";
export type TMediaLibraryUploadFailurePhase = "upload" | "processing";

export type TMediaLibraryUploadJob = {
  id: string;
  file: File;
  workspaceSlug: string;
  projectId: string;
  status: TMediaLibraryUploadStatus;
  progress: number;
  uploadId: string;
  requestId?: string;
  artifactName?: string;
  artifact?: TMediaArtifact;
  packageId?: string;
  transcodeJobId?: string;
  uploadedBytes?: number;
  totalBytes?: number;
  uploadStartedAtMs?: number;
  uploadCompletedAtMs?: number;
  uploadSpeedBytesPerSecond?: number;
  uploadEtaSeconds?: number | null;
  error?: string;
  failedPhase?: TMediaLibraryUploadFailurePhase;
  abortController?: AbortController;
  retryCount?: number;
  meta: Record<string, unknown>;
  workItemId?: string | null;
  createdAtMs: number;
  updatedAtMs: number;
};

export type TMediaLibraryUploadBatchInput = {
  workspaceSlug: string;
  projectId: string;
  files: File[];
  meta: Record<string, unknown>;
  workItemId?: string | null;
};

export const readMediaLibraryFileSizeLimit = (value: unknown) => {
  const limit = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  return Number.isFinite(limit) && limit > 0 ? limit : null;
};

export const getTitleFromFile = (fileName: string) => fileName.replace(/\.[^/.]+$/, "");
export const getFileExtension = (fileName: string) => fileName.split(".").pop()?.toLowerCase() ?? "";
export const buildUploadId = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

export const buildArtifactName = (fileName: string, uploadedAt: number, index: number) => {
  const base = getTitleFromFile(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
  const suffix = `${uploadedAt}-${index}`;
  return base ? `${base}-${suffix}` : `artifact-${suffix}`;
};

export const resolveArtifactFormat = (fileName: string) => {
  const extension = getFileExtension(fileName);
  if (IMAGE_FORMATS.has(extension)) return extension;
  if (VIDEO_FORMATS.has(extension)) return extension;
  if (DOC_FORMATS.has(extension)) return extension;
  return "";
};

export const isDocumentUploadFormat = (format: string) => DOC_FORMATS.has(format);
export const isImageUploadFormat = (format: string) => IMAGE_FORMATS.has(format);
export const isVideoUploadFormat = (format: string) => VIDEO_FORMATS.has(format);
export const isMp4Upload = (file: File) => getFileExtension(file.name) === "mp4" || file.type === "video/mp4";

export const isActiveUploadStatus = (status: TMediaLibraryUploadStatus) =>
  status === "queued" || status === "uploading" || status === "processing";

export const isCompletedUploadStatus = (status: TMediaLibraryUploadStatus) => status === "completed";

export const getVisibleUploadProgress = (job: Pick<TMediaLibraryUploadJob, "progress">) =>
  Math.min(100, Math.max(0, job.progress ?? 0));

export const getUploadStatusLabel = (status: TMediaLibraryUploadStatus) => {
  if (status === "queued") return "Queued";
  if (status === "uploading") return "Uploading";
  if (status === "processing") return "Processing";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Failed";
};

export const buildUploadAttemptRequestId = (uploadId: string, retryCount = 0) => `${uploadId}-try-${retryCount + 1}`;

const pad = (value: number) => String(value).padStart(2, "0");

const formatTimestampForId = (timestampMs: number) => {
  const date = new Date(timestampMs);
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "T",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    "Z",
  ].join("");
};

const sanitizeIdPart = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const buildJobUploadTraceId = (file: File, timestampMs: number) => {
  const safeName = sanitizeIdPart(file.name) || "file";
  return `upload-${formatTimestampForId(timestampMs)}-${safeName}-${Math.max(0, Math.round(file.size))}-${Math.max(
    0,
    Math.round(file.lastModified)
  )}`;
};

export const formatFileSize = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0MB";
  const sizeInMb = value / (1024 * 1024);
  if (sizeInMb >= 1024) {
    const sizeInGb = sizeInMb / 1024;
    if (Number.isInteger(sizeInGb)) return `${sizeInGb.toFixed(0)}GB`;
    return `${sizeInGb.toFixed(sizeInGb >= 10 ? 0 : 1)}GB`;
  }
  return `${sizeInMb.toFixed(0)}MB`;
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getHttpStatus = (error: unknown): number | null => {
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  const status = record.status ?? record.statusCode;
  if (typeof status === "number") return status;
  if (typeof status === "string") {
    const parsedStatus = Number(status);
    return Number.isFinite(parsedStatus) ? parsedStatus : null;
  }
  return null;
};

const isServerFileSizeError = (error: unknown) => {
  if (getHttpStatus(error) === 413) return true;
  if (typeof error === "string") {
    const normalizedError = error.toLowerCase();
    return normalizedError.includes("413") || normalizedError.includes("too large");
  }
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const data = record.data;
    if (data && typeof data === "object") {
      const responseData = data as Record<string, unknown>;
      return responseData.code === "MEDIA_LIBRARY_FILE_TOO_LARGE" || responseData.error === "REQUEST_BODY_TOO_LARGE";
    }
    return record.code === "MEDIA_LIBRARY_FILE_TOO_LARGE" || record.error === "REQUEST_BODY_TOO_LARGE";
  }
  return false;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const data = record.data;
    if (data && typeof data === "object") {
      const responseData = data as Record<string, unknown>;
      if (typeof responseData.detail === "string" && responseData.detail.trim()) return responseData.detail;
      if (typeof responseData.message === "string" && responseData.message.trim()) return responseData.message;
      if (typeof responseData.error === "string" && responseData.error.trim()) return responseData.error;
    }
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

export const getUploadErrorMessage = (error: unknown) => {
  if (isServerFileSizeError(error)) {
    return "Server rejected this file as too large. Increase the upload size limit or choose a smaller file.";
  }
  return getErrorMessage(error, "Upload failed");
};

export const buildMediaLibraryUploadJobs = ({
  workspaceSlug,
  projectId,
  files,
  meta,
  workItemId,
}: TMediaLibraryUploadBatchInput): TMediaLibraryUploadJob[] => {
  const createdAtMs = Date.now();

  return files.map((file, index) => {
    const uploadId = buildJobUploadTraceId(file, createdAtMs + index);

    return {
      id: `${uploadId}-${index}`,
      file,
      workspaceSlug,
      projectId,
      status: "queued",
      progress: 0,
      uploadId,
      retryCount: 0,
      meta: { ...meta },
      workItemId,
      createdAtMs,
      updatedAtMs: createdAtMs,
    };
  });
};
