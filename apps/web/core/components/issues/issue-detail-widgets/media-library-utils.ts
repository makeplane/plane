"use client";

import { API_BASE_URL } from "@plane/constants";
import type { TIssue, TIssueAttachment } from "@plane/types";
import { getFileExtension, getFileName } from "@plane/utils";

export const IMAGE_FORMATS = new Set([
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

export const VIDEO_FORMATS = new Set(["mp4", "m3u8", "mov", "webm", "avi", "mkv", "mpeg", "mpg", "m4v"]);
export const DOC_FORMATS = new Set(["json", "csv", "pdf", "docx", "xlsx", "pptx", "txt"]);

export const resolveArtifactFormat = (fileName: string) => {
  const extension = getFileExtension(fileName).toLowerCase();
  if (IMAGE_FORMATS.has(extension)) return extension;
  if (VIDEO_FORMATS.has(extension)) return extension;
  if (DOC_FORMATS.has(extension)) return extension;
  return "";
};

export const resolveArtifactAction = (format: string) => {
  if (VIDEO_FORMATS.has(format)) return "play";
  if (IMAGE_FORMATS.has(format)) return "view";
  return "download";
};

const sanitizeArtifactSegment = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const buildArtifactName = (fileName: string, attachmentId: string) => {
  const baseName = sanitizeArtifactSegment(getFileName(fileName) || "attachment");
  const suffix = sanitizeArtifactSegment(attachmentId) || `${Date.now()}`;
  return baseName ? `${baseName}-${suffix}` : `attachment-${suffix}`;
};

export const resolveAttachmentFileName = (attachment: TIssueAttachment) => {
  if (attachment.attributes?.name) return attachment.attributes.name;
  const rawUrl = attachment.asset_url ?? "";
  const baseUrl = rawUrl.split("?")[0];
  const segments = baseUrl.split("/").filter(Boolean);
  return segments[segments.length - 1] || "attachment";
};

const resolveAbsoluteAssetUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : API_BASE_URL
        ? (() => {
            try {
              return new URL(API_BASE_URL).origin;
            } catch {
              return API_BASE_URL;
            }
          })()
        : "";
  if (!origin) return trimmed;
  try {
    return new URL(trimmed, origin).toString();
  } catch {
    return trimmed;
  }
};

export const resolveArtifactPathFromAssetUrl = (rawUrl: string) => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return "";
  const absolute = resolveAbsoluteAssetUrl(trimmed);
  if (!/^https?:\/\//i.test(absolute)) return "";
  const origins = new Set<string>();
  if (typeof window !== "undefined") {
    origins.add(window.location.origin);
  }
  if (API_BASE_URL) {
    try {
      origins.add(new URL(API_BASE_URL).origin);
    } catch {
      // ignore invalid API base url
    }
  }
  try {
    const parsed = new URL(absolute);
    if (!origins.has(parsed.origin)) return "";
  } catch {
    return "";
  }
  return absolute;
};

export const getErrorMessage = (error: unknown) => {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const errorObj = error as { error?: string; message?: string };
    if (typeof errorObj.error === "string") return errorObj.error;
    if (typeof errorObj.message === "string") return errorObj.message;
  }
  return "";
};

const toAbsoluteApiUrl = (rawUrl: string) => {
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (!API_BASE_URL) return rawUrl;
  try {
    return new URL(rawUrl, API_BASE_URL).toString();
  } catch {
    return rawUrl;
  }
};

export const resolveAttachmentDownloadUrl = async (rawUrl: string) => {
  if (!rawUrl) return "";
  const normalizedUrl = toAbsoluteApiUrl(rawUrl);
  if (!API_BASE_URL || !normalizedUrl.startsWith(API_BASE_URL)) {
    return normalizedUrl || rawUrl;
  }

  const url = new URL(normalizedUrl);
  url.searchParams.set("response", "json");
  const response = await fetch(url.toString(), { credentials: "include" });
  if (!response.ok) {
    throw new Error("Unable to access attachment.");
  }
  const contentType = response.headers.get("content-type") ?? "";
  const contentLength = Number(response.headers.get("content-length") ?? "NaN");
  const shouldAttemptJson =
    contentType.includes("application/json") ||
    (Number.isFinite(contentLength) && contentLength > 0 && contentLength < 1024 * 1024);

  if (!shouldAttemptJson) {
    response.body?.cancel?.();
    return normalizedUrl;
  }

  try {
    const data = (await response.json()) as { url?: string };
    return data.url ?? normalizedUrl;
  } catch {
    response.body?.cancel?.();
    return normalizedUrl;
  }
};

export const buildEventMeta = (issue?: TIssue, createdBy?: string) => {
  const meta: Record<string, unknown> = {
    category: issue?.category || "Work items",
    source: "work_item_attachment",
  };

  if (createdBy) meta.created_by = createdBy;
  if (issue?.start_date) meta.start_date = issue.start_date;
  if (issue?.start_time) meta.start_time = issue.start_time;
  if (issue?.level) meta.level = issue.level;
  if (issue?.program) meta.program = issue.program;
  if (issue?.sport) meta.sport = issue.sport;
  if (issue?.opposition_team) meta.opposition = issue.opposition_team;
  if (issue?.year) meta.season = issue.year;

  return meta;
};

export const isDuplicateArtifactError = (error: unknown) => {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("already exists") || message.includes("duplicate");
};
