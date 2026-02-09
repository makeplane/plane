"use client";

import { API_BASE_URL } from "@plane/constants";

import type { TMediaArtifact } from "@/services/media-library.service";
import type { TMediaItem, TMediaSection } from "../types";

type TArtifactContext = {
  workspaceSlug: string;
  projectId: string;
  packageId: string;
  metadata?: Record<string, Record<string, unknown>>;
};

const VIDEO_FORMATS = new Set(["mp4", "m3u8", "mov", "webm", "avi", "mkv", "mpeg", "mpg", "m4v"]);
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
  "thumbnail",
]);
const GENERIC_FORMAT_VALUES = new Set(["application/octet-stream", "application", "video", "image", "binary", "octet-stream"]);
const FORMAT_OVERRIDES: Record<string, string> = {
  "application/vnd.apple.mpegurl": "m3u8",
  "application/x-mpegurl": "m3u8",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
  "image/svg+xml": "svg",
};
const VIDEO_ACTIONS = new Set(["play", "play_hls", "play_streaming", "open_mp4"]);
const DOCUMENT_THUMBNAILS: Record<string, string> = {
  pdf: "attachment/pdf-icon.png",
  doc: "attachment/doc-icon.png",
  docx: "attachment/doc-icon.png",
  xls: "attachment/excel-icon.png",
  xlsx: "attachment/excel-icon.png",
  csv: "attachment/csv-icon.png",
  txt: "attachment/txt-icon.png",
  json: "attachment/txt-icon.png",
  md: "attachment/txt-icon.png",
  log: "attachment/txt-icon.png",
  xml: "attachment/txt-icon.png",
  yml: "attachment/txt-icon.png",
  yaml: "attachment/txt-icon.png",
  html: "attachment/html-icon.png",
  css: "attachment/css-icon.png",
};

const resolveArtifactPath = (path: string) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `/${path.replace(/^\/+/, "")}`;
};

const joinApiPath = (base: string, path: string) => `${base?.replace(/\/$/, "") ?? ""}${path}`;

const buildArtifactFileUrl = (context: TArtifactContext, artifactName: string) =>
  joinApiPath(
    API_BASE_URL,
    `/api/workspaces/${context.workspaceSlug}/projects/${context.projectId}/media-library/packages/${context.packageId}/artifacts/${encodeURIComponent(
      artifactName
    )}/file/`
  );

const resolveArtifactSource = (artifact: TMediaArtifact, context?: TArtifactContext) => {
  const rawPath = artifact.path ?? "";
  if (rawPath && /^https?:\/\//i.test(rawPath)) return rawPath;
  if (context && artifact.name) {
    return buildArtifactFileUrl(context, artifact.name);
  }
  return resolveArtifactPath(rawPath);
};

const formatDateLabel = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  const date = new Date(parsed);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getMetaObject = (meta: unknown) => {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return {};
};

const resolveArtifactMeta = (artifact: TMediaArtifact, metadata?: Record<string, Record<string, unknown>>) => {
  const directMeta = getMetaObject(artifact.meta);
  if (Object.keys(directMeta).length > 0) return directMeta;
  const ref = (artifact.metadata_ref ?? "").trim() || artifact.name;
  return getMetaObject(metadata?.[ref]);
};

const getMetaString = (meta: Record<string, unknown>, keys: string[], fallback = "") => {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
};

const getMetaNumber = (meta: Record<string, unknown>, keys: string[], fallback = 0) => {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return fallback;
};

const getMetaStringArray = (meta: Record<string, unknown>, key: string) => {
  const value = meta[key];
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
};

const getMetaDuration = (meta: Record<string, unknown>, keys: string[], fallback = "") => {
  const stringValue = getMetaString(meta, keys, "");
  if (stringValue) return stringValue;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
};

const getFormatFromPath = (value?: string) => {
  const rawValue = value?.trim();
  if (!rawValue) return "";
  const withoutQuery = rawValue.split("?")[0].split("#")[0];
  const fileName = withoutQuery.split("/").pop() ?? "";
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) return "";
  return fileName.slice(dotIndex + 1).toLowerCase();
};

const containsHtmlTags = (value: string) => /<\/?[a-z][^>]*>/i.test(value);

const decodeHtmlEntities = (value: string) => {
  if (!value) return "";
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) => {
    const normalized = entity.toLowerCase();
    if (normalized === "nbsp") return " ";
    if (normalized === "amp") return "&";
    if (normalized === "lt") return "<";
    if (normalized === "gt") return ">";
    if (normalized === "quot") return '"';
    if (normalized === "apos") return "'";
    if (normalized.startsWith("#x")) {
      const code = Number.parseInt(normalized.slice(2), 16);
      if (!Number.isFinite(code)) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    }
    if (normalized.startsWith("#")) {
      const code = Number.parseInt(normalized.slice(1), 10);
      if (!Number.isFinite(code)) return "";
      try {
        return String.fromCodePoint(code);
      } catch {
        return "";
      }
    }
    return "";
  });
};

const htmlToPlainText = (value: string) => {
  if (!value) return "";
  if (!containsHtmlTags(value)) return value.trim();
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|ul|ol|h[1-6]|tr|blockquote|pre)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

const inferFormatFromPaths = (...paths: Array<string | null | undefined>) => {
  for (const path of paths) {
    if (!path) continue;
    const inferred = getFormatFromPath(path);
    if (inferred) return inferred;
  }
  return "";
};

const normalizeFormat = (value: string | null | undefined, ...fallbackPaths: Array<string | null | undefined>) => {
  const rawValue = (value ?? "").trim().toLowerCase();
  const cleaned = rawValue.replace(/^\./, "");
  if (cleaned) {
    const override = FORMAT_OVERRIDES[cleaned];
    if (override) return override;
    if (GENERIC_FORMAT_VALUES.has(cleaned)) {
      return inferFormatFromPaths(...fallbackPaths);
    }
    if (cleaned.includes("/")) {
      const [, subtype = ""] = cleaned.split("/");
      if (subtype === "vnd.apple.mpegurl" || subtype === "x-mpegurl" || subtype === "mpegurl") return "m3u8";
      if (subtype === "quicktime") return "mov";
      if (subtype === "x-matroska") return "mkv";
      if (subtype === "x-msvideo") return "avi";
      if (subtype === "svg+xml") return "svg";
      return subtype.replace(/^x-/, "");
    }
    return cleaned;
  }
  return inferFormatFromPaths(...fallbackPaths);
};

const getMediaType = (format: string, rawFormat = "", action = ""): TMediaItem["mediaType"] => {
  if (VIDEO_FORMATS.has(format)) return "video";
  if (IMAGE_FORMATS.has(format)) return "image";
  const normalizedRaw = rawFormat.trim().toLowerCase();
  if (normalizedRaw.startsWith("video/") || normalizedRaw === "video" || normalizedRaw.includes("mpegurl")) {
    return "video";
  }
  if (normalizedRaw.startsWith("image/") || normalizedRaw === "image") return "image";
  if (VIDEO_ACTIONS.has(action.trim().toLowerCase())) return "video";
  return "document";
};

export const getDocumentThumbnailPath = (format?: string) => {
  const key = (format ?? "").toLowerCase();
  return DOCUMENT_THUMBNAILS[key] ?? "attachment/default-icon.png";
};

export const resolveMediaItemActionHref = (item: TMediaItem) => {
  const action = (item.action ?? "").toLowerCase();

  if (item.mediaType === "video" || VIDEO_ACTIONS.has(action)) return null;
  if (action === "open_pdf" && item.fileSrc) {
    return `/viewer?src=${encodeURIComponent(item.fileSrc)}&type=pdf`;
  }
  if ((action === "download" || action === "view") && item.fileSrc) {
    return item.fileSrc;
  }

  return null;
};

export const mapArtifactsToMediaItems = (
  artifacts: TMediaArtifact[],
  context?: TArtifactContext
): TMediaItem[] => {
  const thumbnailByLink = new Map<string, string>();
  const mediaTypeByName = new Map<string, TMediaItem["mediaType"]>();
  const artifactByName = new Map<string, TMediaArtifact>();

  const normalizeKey = (value: string) => value.trim().toLowerCase();

  for (const artifact of artifacts) {
    const rawFormat = artifact.format ?? "";
    const normalizedAction = (artifact.action ?? "").toLowerCase();
    const actionFormat =
      normalizedAction === "play_hls" || normalizedAction === "play_streaming"
        ? "m3u8"
        : normalizedAction === "open_mp4"
          ? "mp4"
          : "";
    const format = normalizeFormat(rawFormat, artifact.path, artifact.name, artifact.link) || actionFormat;
    if (artifact.name) {
      mediaTypeByName.set(normalizeKey(artifact.name), getMediaType(format, rawFormat, artifact.action ?? ""));
      artifactByName.set(normalizeKey(artifact.name), artifact);
    }
    if (!artifact.link || !IMAGE_FORMATS.has(format)) continue;
    const isPreview = artifact.action === "preview" || format === "thumbnail";
    if (isPreview) {
      thumbnailByLink.set(artifact.link, resolveArtifactSource(artifact, context));
    }
  }

  const sortedArtifacts = [...artifacts].sort((left, right) => {
    const leftTime = Date.parse(left.created_at || left.updated_at || "");
    const rightTime = Date.parse(right.created_at || right.updated_at || "");
    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
    if (Number.isNaN(leftTime)) return 1;
    if (Number.isNaN(rightTime)) return -1;
    return rightTime - leftTime;
  });

  return sortedArtifacts.map((artifact) => {
    const rawFormat = artifact.format ?? "";
    const normalizedAction = (artifact.action ?? "").toLowerCase();
    const actionFormat =
      normalizedAction === "play_hls" || normalizedAction === "play_streaming"
        ? "m3u8"
        : normalizedAction === "open_mp4"
          ? "mp4"
          : "";
    const format = normalizeFormat(rawFormat, artifact.path, artifact.name, artifact.link) || actionFormat;
    const mediaType = getMediaType(format, rawFormat, artifact.action ?? "");
    const meta = resolveArtifactMeta(artifact, context?.metadata);
    const linkedArtifact = artifact.link ? artifactByName.get(normalizeKey(artifact.link)) : undefined;
    const displayTitle =
      format === "thumbnail" && linkedArtifact?.title ? linkedArtifact.title : artifact.title;
    const baseDescription = (artifact.description ?? getMetaString(meta, ["description", "summary"], "")).trim();
    const description = format === "thumbnail" ? "" : htmlToPlainText(baseDescription);
    const descriptionHtml =
      format === "thumbnail" || !containsHtmlTags(baseDescription) ? undefined : baseDescription;

    const createdAt = formatDateLabel(artifact.created_at || artifact.updated_at || "");
    const views = getMetaNumber(meta, ["views"], 0);
    const duration = getMetaDuration(meta, ["duration"], "");

    const primaryTag = getMetaString(meta, ["category", "sport", "program"], "Uploads");
    const linkValue = artifact.link ?? getMetaString(meta, ["for"], "");
    const linkTarget = linkValue ? normalizeKey(linkValue) : "";
    const linkFormat = getFormatFromPath(linkValue);
    const linkedFormat = linkedArtifact
      ? normalizeFormat(linkedArtifact.format, linkedArtifact.path, linkedArtifact.name, linkedArtifact.link) ||
        linkFormat
      : linkFormat || undefined;
    const metaKind = getMetaString(meta, ["kind"], "").toLowerCase();
    const metaSource = getMetaString(meta, ["source"], "").toLowerCase();
    const inferredLinkedMediaType =
      normalizedAction === "play" ||
        normalizedAction === "preview" ||
        normalizedAction === "play_hls" ||
        normalizedAction === "play_streaming" ||
        normalizedAction === "open_mp4"
        ? "video"
        : normalizedAction === "view" || normalizedAction === "open_image"
          ? "image"
          : format === "thumbnail" && (normalizedAction === "open_pdf" || normalizedAction === "download")
            ? "document"
            : format === "thumbnail" && metaKind === "thumbnail"
              ? "document"
              : format === "thumbnail" && metaSource === "generated"
                ? "video"
                : format === "thumbnail"
                  ? "image"
                  : "document";
    const linkedMediaType = linkTarget
      ? mediaTypeByName.get(linkTarget) ?? (linkFormat ? getMediaType(linkFormat) : inferredLinkedMediaType)
      : undefined;
    const secondaryTag = getMetaString(meta, ["season", "level", "coach"], "Media");
    const itemsCount = getMetaNumber(meta, ["itemsCount", "items_count"], 1);
    const author = getMetaString(meta, ["coach", "author", "creator"], "Media Library");
    const docs = getMetaStringArray(meta, "docs");

    const rawPath = artifact.path ?? "";
    const resolvedPath = resolveArtifactSource(artifact, context);
    const downloadablePath = context && artifact.name ? buildArtifactFileUrl(context, artifact.name) : "";
    const directDownloadPath = rawPath && /^https?:\/\//i.test(rawPath) ? rawPath : "";

    const metaThumbnail = getMetaString(meta, ["thumbnail"], "");
    const fallbackThumbnail =
      mediaType === "image" ? resolvedPath : mediaType === "document" ? getDocumentThumbnailPath(format) : "";
    const thumbnail = resolveArtifactPath(metaThumbnail || thumbnailByLink.get(artifact.name) || fallbackThumbnail);

    return {
      id: artifact.name,
      packageId: context?.packageId,
      title: displayTitle,
      description,
      descriptionHtml,
      format,
      linkedFormat,
      action: artifact.action,
      link: artifact.link ?? null,
      workItemId: artifact.work_item_id ?? null,
      author,
      createdAt,
      views,
      duration,
      primaryTag,
      secondaryTag,
      itemsCount,
      meta,
      mediaType,
      linkedMediaType,
      thumbnail,
      videoSrc: mediaType === "video" ? resolvedPath : undefined,
      imageSrc: mediaType === "image" ? resolvedPath : undefined,
      fileSrc: mediaType === "document" ? resolvedPath : undefined,
      downloadSrc: directDownloadPath || downloadablePath || undefined,
      docs,
    };
  });
};

export const groupMediaItemsByTag = (
  items: TMediaItem[],
  fallbackTitle = "Upload"
): TMediaSection[] => {
  const grouped = new Map<string, TMediaItem[]>();
  for (const item of items) {
    const key = item.primaryTag || fallbackTitle;
    const group = grouped.get(key);
    if (group) group.push(item);
    else grouped.set(key, [item]);
  }

  // console.log("Grouped Items:", items);

  return Array.from(grouped.entries()).map(([title, sectionItems]) => ({
    title,
    items: sectionItems,
  }));
};
