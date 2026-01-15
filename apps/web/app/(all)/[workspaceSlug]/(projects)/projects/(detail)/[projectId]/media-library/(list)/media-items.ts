"use client";

import { API_BASE_URL } from "@plane/constants";

import type { TMediaArtifact } from "@/services/media-library.service";

export type TMediaItem = {
  id: string;
  title: string;
  format: string;
  action: string;
  link?: string | null;
  author: string;
  createdAt: string;
  views: number;
  duration: string;
  primaryTag: string;
  secondaryTag: string;
  itemsCount: number;
  meta: Record<string, unknown>;
  mediaType: "video" | "image" | "document";
  linkedMediaType?: "video" | "image" | "document";
  thumbnail: string;
  videoSrc?: string;
  fileSrc?: string;
  docs: string[];
};

export type TMediaSection = {
  title: string;
  items: TMediaItem[];
};

type TArtifactContext = {
  workspaceSlug: string;
  projectId: string;
  packageId: string;
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

const getMediaType = (format: string): TMediaItem["mediaType"] => {
  if (VIDEO_FORMATS.has(format)) return "video";
  if (IMAGE_FORMATS.has(format)) return "image";
  return "document";
};

export const getDocumentThumbnailPath = (format?: string) => {
  const key = (format ?? "").toLowerCase();
  return DOCUMENT_THUMBNAILS[key] ?? "attachment/default-icon.png";
};

export const resolveMediaItemActionHref = (item: TMediaItem) => {
  const action = (item.action ?? "").toLowerCase();

  if (action === "play_hls" && item.videoSrc) {
    return `/player?src=${encodeURIComponent(item.videoSrc)}&type=m3u8`;
  }
  if (action === "open_mp4" && item.videoSrc) {
    return `/player?src=${encodeURIComponent(item.videoSrc)}&type=mp4`;
  }
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
    const format = (artifact.format ?? "").toLowerCase();
    if (artifact.name) {
      mediaTypeByName.set(normalizeKey(artifact.name), getMediaType(format));
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
    const format = (artifact.format ?? "").toLowerCase();
    const mediaType = getMediaType(format);
    const meta = getMetaObject(artifact.meta);
    const linkedArtifact = artifact.link ? artifactByName.get(artifact.link) : undefined;
    const displayTitle =
      format === "thumbnail" && linkedArtifact?.title ? linkedArtifact.title : artifact.title;

    const createdAt = formatDateLabel(artifact.created_at || artifact.updated_at || "");
    const views = getMetaNumber(meta, ["views"], 0);
    const duration = getMetaDuration(meta, ["duration"], "");

    const primaryTag = getMetaString(meta, ["category", "sport", "program"], "Uploads");
    const linkValue = artifact.link ?? getMetaString(meta, ["for"], "");
    const linkTarget = linkValue ? normalizeKey(linkValue) : "";
    const linkFormat = getFormatFromPath(linkValue);
    const normalizedAction = (artifact.action ?? "").toLowerCase();
    const metaKind = getMetaString(meta, ["kind"], "").toLowerCase();
    const metaSource = getMetaString(meta, ["source"], "").toLowerCase();
    const inferredLinkedMediaType =
      normalizedAction === "play" ||
        normalizedAction === "preview" ||
        normalizedAction === "play_hls" ||
        normalizedAction === "open_mp4"
        ? "video"
        : normalizedAction === "view" || normalizedAction === "open_image"
          ? "image"
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

    const resolvedPath = resolveArtifactSource(artifact, context);

    const metaThumbnail = getMetaString(meta, ["thumbnail"], "");
    const fallbackThumbnail =
      mediaType === "image" ? resolvedPath : mediaType === "document" ? getDocumentThumbnailPath(format) : "";
    const thumbnail = resolveArtifactPath(metaThumbnail || thumbnailByLink.get(artifact.name) || fallbackThumbnail);

    return {
      id: artifact.name,
      title: displayTitle,
      format,
      action: artifact.action,
      link: artifact.link ?? null,
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
      fileSrc: mediaType === "document" ? resolvedPath : undefined,
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

  console.log("Grouped Items:", items);

  return Array.from(grouped.entries()).map(([title, sectionItems]) => ({
    title,
    items: sectionItems,
  }));
};
