const UPLOAD_PROGRESS_LOG_PERCENT_STEP = 10;
const UPLOAD_PROGRESS_LOG_INTERVAL_MS = 15_000;

type TUploadTraceInput = {
  fileName: string;
  fileSize: number;
  lastModified: number;
  timestampMs?: number;
};

type TUploadProgressInput = {
  loadedBytes: number;
  totalBytes: number;
  startedAtMs: number;
  nowMs: number;
};

type TShouldLogUploadProgressInput = {
  percent: number;
  lastLoggedPercent: number | null;
  lastLoggedAtMs: number | null;
  nowMs: number;
};

export type TUploadProgressMetrics = {
  percent: number;
  uploadedBytes: number;
  totalBytes: number;
  speedBytesPerSecond: number;
  etaSeconds: number | null;
};

export type TMediaUploadLogLevel = "info" | "warn" | "error";

export type TMediaUploadLifecycleEvent = {
  level?: TMediaUploadLogLevel;
  event: string;
  uploadId: string;
  requestId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  artifactName?: string;
  packageId?: string;
  projectId?: string;
  workspaceSlug?: string;
  percent?: number;
  uploadedBytes?: number;
  totalBytes?: number;
  speedBytesPerSecond?: number;
  etaSeconds?: number | null;
  durationMs?: number;
  transcodeJobId?: string;
  error?: string;
};

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

export const buildUploadTraceId = ({
  fileName,
  fileSize,
  lastModified,
  timestampMs = Date.now(),
}: TUploadTraceInput) => {
  const safeName = sanitizeIdPart(fileName) || "file";
  return `upload-${formatTimestampForId(timestampMs)}-${safeName}-${Math.max(0, Math.round(fileSize))}-${Math.max(
    0,
    Math.round(lastModified)
  )}`;
};

export const calculateUploadProgressMetrics = ({
  loadedBytes,
  totalBytes,
  startedAtMs,
  nowMs,
}: TUploadProgressInput): TUploadProgressMetrics => {
  const safeLoaded = Math.max(0, Math.round(loadedBytes || 0));
  const safeTotal = Math.max(0, Math.round(totalBytes || 0));
  const elapsedSeconds = Math.max(0, (nowMs - startedAtMs) / 1000);
  const speedBytesPerSecond = elapsedSeconds > 0 ? Math.round(safeLoaded / elapsedSeconds) : 0;
  const percent = safeTotal > 0 ? Math.min(100, Math.max(0, Math.round((safeLoaded / safeTotal) * 100))) : 0;
  const remainingBytes = Math.max(0, safeTotal - safeLoaded);
  const etaSeconds = safeTotal > 0 && speedBytesPerSecond > 0 ? Math.ceil(remainingBytes / speedBytesPerSecond) : null;

  return {
    percent,
    uploadedBytes: safeLoaded,
    totalBytes: safeTotal,
    speedBytesPerSecond,
    etaSeconds,
  };
};

export const formatUploadSpeed = (bytesPerSecond: number) => {
  const safeValue = Math.max(0, bytesPerSecond || 0);
  if (safeValue <= 0) return "Speed calculating";
  if (safeValue < 1024 * 1024) return `${Math.round(safeValue / 1024)} KB/s`;
  return `${(safeValue / (1024 * 1024)).toFixed(safeValue >= 10 * 1024 * 1024 ? 0 : 1)} MB/s`;
};

export const formatUploadEta = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return "ETA calculating";
  if (seconds < 60) return `ETA ${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes < 60) {
    return remainingSeconds > 0 ? `ETA ${minutes}m ${remainingSeconds}s` : `ETA ${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `ETA ${hours}h ${remainingMinutes}m` : `ETA ${hours}h`;
};

export const shouldLogUploadProgress = ({
  percent,
  lastLoggedPercent,
  lastLoggedAtMs,
  nowMs,
}: TShouldLogUploadProgressInput) => {
  if (lastLoggedPercent === null || lastLoggedAtMs === null) return true;
  const nextMilestone =
    Math.floor(lastLoggedPercent / UPLOAD_PROGRESS_LOG_PERCENT_STEP) * UPLOAD_PROGRESS_LOG_PERCENT_STEP;
  if (percent >= nextMilestone + UPLOAD_PROGRESS_LOG_PERCENT_STEP) return true;
  return nowMs - lastLoggedAtMs >= UPLOAD_PROGRESS_LOG_INTERVAL_MS;
};

export const logMediaUploadLifecycle = ({ level = "info", ...event }: TMediaUploadLifecycleEvent) => {
  const payload = {
    ts: new Date().toISOString(),
    source: "media-library-upload-modal",
    ...event,
  };
  if (level === "error") {
    console.error("[media-library.upload]", payload);
    return;
  }
  if (level === "warn") {
    console.warn("[media-library.upload]", payload);
    return;
  }
  console.info("[media-library.upload]", payload);
};
