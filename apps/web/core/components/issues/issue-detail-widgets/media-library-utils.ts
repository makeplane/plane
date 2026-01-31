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

export const resolveAttachmentDownloadUrl = async (rawUrl: string) => {
  if (!rawUrl) return "";
  if (!API_BASE_URL || !rawUrl.startsWith(API_BASE_URL)) {
    return rawUrl;
  }

  const url = new URL(rawUrl);
  url.searchParams.set("response", "json");
  const response = await fetch(url.toString(), { credentials: "include" });
  if (!response.ok) {
    throw new Error("Unable to access attachment.");
  }
  const data = (await response.json()) as { url?: string };
  return data.url ?? "";
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
