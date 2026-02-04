export const formatMetaValue = (value: unknown) => {
  if (value === null || value === undefined) return "--";
  if (Array.isArray(value)) {
    const entries = value
      .map((entry) => formatMetaValue(entry))
      .filter((entry) => entry && entry !== "--");
    return entries.length ? entries.join(", ") : "--";
  }
  if (typeof value === "string") return value.trim() ? value : "--";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const namedValue = (value as Record<string, unknown>)?.name;
    if (typeof namedValue === "string" && namedValue.trim()) return namedValue.trim();
  }
  return JSON.stringify(value);
};

export const formatMetaLabel = (value: string) => {
  if (!value) return value;
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk[0]?.toUpperCase() + chunk.slice(1))
    .join(" ");
};

export const getMetaString = (meta: Record<string, unknown>, keys: string[], fallback = "") => {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
};

export const getMetaNumber = (meta: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return null;
};

export const getMetaObject = (meta: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = meta[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return null;
};

export const formatFileSize = (value: unknown) => {
  const size = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(size) || size <= 0) return "--";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let normalized = size;
  while (normalized >= 1024 && unitIndex < units.length - 1) {
    normalized /= 1024;
    unitIndex += 1;
  }
  const precision = normalized >= 10 || unitIndex === 0 ? 0 : 1;
  return `${normalized.toFixed(precision)} ${units[unitIndex]}`;
};

const parseDateValue = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    return { date: new Date(Date.UTC(year, month - 1, day)), isDateOnly: true };
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return null;
  return { date: new Date(parsed), isDateOnly: false };
};

export const formatDateValue = (value?: string | null) => {
  const parsed = parseDateValue(value);
  if (!parsed) return value?.trim() || "--";
  const baseOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const primaryOptions = parsed.isDateOnly ? { ...baseOptions, timeZone: "UTC" } : baseOptions;
  try {
    return parsed.date.toLocaleDateString(undefined, primaryOptions);
  } catch {
    try {
      return parsed.date.toLocaleDateString(undefined, baseOptions);
    } catch {
      return parsed.date.toLocaleDateString();
    }
  }
};

export const formatTimeValue = (value?: string | null) => {
  const parsed = parseDateValue(value);
  if (!parsed) return value?.trim() || "--";
  if (parsed.isDateOnly) return "--";
  const primaryOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  try {
    return parsed.date.toLocaleTimeString(undefined, primaryOptions);
  } catch {
    try {
      return parsed.date.toLocaleTimeString();
    } catch {
      return `${parsed.date.getHours().toString().padStart(2, "0")}:${parsed.date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    }
  }
};

export const resolveOppositionLogoUrl = (logo?: string | null) => {
  if (!logo) return "";
  if (/^https?:\/\//i.test(logo)) return logo;
  const base = process.env.NEXT_PUBLIC_CP_SERVER_URL?.replace(/\/$/, "") ?? "";
  if (!base) return "";
  return `${base}/blobs/${logo.replace(/^\/+/, "")}`;
};

export const isMeaningfulValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "" && value !== "--";
  return true;
};

export const DOCUMENT_PREVIEW_STYLE = `
<style>
  .document-preview {
    color: #111827;
    font-size: 14px;
    line-height: 1.6;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
  }
  .document-preview h1,
  .document-preview h2,
  .document-preview h3,
  .document-preview h4,
  .document-preview h5,
  .document-preview h6 {
    font-weight: 600;
    margin: 0 0 0.75rem;
  }
  .document-preview p {
    margin: 0 0 0.75rem;
  }
  .document-preview ul,
  .document-preview ol {
    padding-left: 1.25rem;
    margin: 0 0 0.75rem;
  }
  .document-preview table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0;
  }
  .document-preview th,
  .document-preview td {
    border: 1px solid #e5e7eb;
    padding: 6px 8px;
    vertical-align: top;
  }
  .document-preview tr:nth-child(even) {
    background: #f9fafb;
  }
  .document-preview pre,
  .document-preview code {
    background: #f3f4f6;
    border-radius: 4px;
  }
  .document-preview pre {
    padding: 8px 10px;
    overflow: auto;
  }
  .document-preview code {
    padding: 2px 4px;
  }
</style>
`;

export const getVideoMimeType = (format: string) => {
  const normalized = format.toLowerCase();
  if (normalized === "mp4" || normalized === "m4v") return "video/mp4";
  if (normalized === "m3u8" || normalized === "stream") return "application/x-mpegURL";
  if (normalized === "mov") return "video/quicktime";
  if (normalized === "webm") return "video/webm";
  if (normalized === "avi") return "video/x-msvideo";
  if (normalized === "mkv") return "video/x-matroska";
  if (normalized === "mpeg" || normalized === "mpg") return "video/mpeg";
  return "";
};

export const getVideoFormatFromSrc = (src: string) => {
  const match = src.toLowerCase().match(/\.(mp4|m4v|m3u8|mov|webm|avi|mkv|mpeg|mpg)(\?.*)?$/);
  return match?.[1] ?? "";
};

export type TCaptionTrack = {
  src: string;
  label?: string;
  srclang?: string;
  kind?: "captions" | "subtitles";
  default?: boolean;
};

export const getCaptionTracks = (meta: unknown): TCaptionTrack[] => {
  if (!meta || typeof meta !== "object") return [];
  const raw = (meta as Record<string, unknown>).captions ?? (meta as Record<string, unknown>).subtitles;
  if (!raw) return [];
  const tracks = Array.isArray(raw) ? raw : [raw];
  return tracks
    .map((entry) => {
      if (typeof entry === "string") {
        return { src: entry, label: "CC", kind: "captions" } as TCaptionTrack;
      }
      if (!entry || typeof entry !== "object") return null;
      const data = entry as Record<string, unknown>;
      const src = typeof data.src === "string" ? data.src : "";
      if (!src) return null;
      return {
        src,
        label: typeof data.label === "string" ? data.label : undefined,
        srclang: typeof data.srclang === "string" ? data.srclang : undefined,
        kind: data.kind === "subtitles" ? "subtitles" : "captions",
        default: Boolean(data.default),
      } as TCaptionTrack;
    })
    .filter((entry): entry is TCaptionTrack => Boolean(entry?.src));
};

export const getVideoRepresentations = (player: any) => {
  const tech = player?.tech?.(true);
  const vhs = tech?.vhs;
  const reps = typeof vhs?.representations === "function" ? vhs.representations() : [];
  return Array.isArray(reps) ? reps : [];
};

export const getQualitySelection = (representations: any[]) => {
  const enabled = representations.filter((rep) => rep?.enabled?.());
  if (enabled.length === 1) {
    return { isAuto: false, activeRep: enabled[0] };
  }
  return { isAuto: true, activeRep: null };
};

export const buildDownloadUrl = (src: string) => {
  if (!src) return "";
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}download=1`;
};

export const addInlineDisposition = (src: string) => {
  if (!src) return "";
  try {
    const url = new URL(src);
    url.searchParams.set("disposition", "inline");
    return url.toString();
  } catch {
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}disposition=inline`;
  }
};
