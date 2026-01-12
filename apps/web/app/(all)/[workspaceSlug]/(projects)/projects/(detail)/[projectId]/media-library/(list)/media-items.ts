"use client";

import { API_BASE_URL } from "@plane/constants";

import type { TMediaArtifact } from "@/services/media-library.service";

export type TMediaItem = {
  id: string;
  title: string;
  format: string;
  author: string;
  createdAt: string;
  views: number;
  duration: string;
  primaryTag: string;
  secondaryTag: string;
  itemsCount: number;
  meta: Record<string, unknown>;
  mediaType: "video" | "image" | "document";
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

const VIDEO_FORMATS = new Set(["mp4", "m3u8"]);
const IMAGE_FORMATS = new Set(["jpg", "jpeg", "png", "svg", "thumbnail"]);

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

const getMediaType = (format: string): TMediaItem["mediaType"] => {
  if (VIDEO_FORMATS.has(format)) return "video";
  if (IMAGE_FORMATS.has(format)) return "image";
  return "document";
};

/** ✅ NEW: convert seconds to m:ss */
const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export const mapArtifactsToMediaItems = (
  artifacts: TMediaArtifact[],
  context?: TArtifactContext
): TMediaItem[] => {
  const thumbnailByLink = new Map<string, string>();

  for (const artifact of artifacts) {
    const format = (artifact.format ?? "").toLowerCase();
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

  const displayArtifacts = sortedArtifacts.filter((artifact) => {
    const format = (artifact.format ?? "").toLowerCase();
    if ((artifact.action === "preview" || format === "thumbnail") && artifact.link) {
      return false;
    }
    return true;
  });

  return displayArtifacts.map((artifact) => {
    const format = (artifact.format ?? "").toLowerCase();
    const mediaType = getMediaType(format);
    const meta = getMetaObject(artifact.meta);

    const createdAt = formatDateLabel(artifact.created_at || artifact.updated_at || "");
    const views = getMetaNumber(meta, ["views"], 0);

    /** ✅ FIXED duration mapping */
    const duration =
      getMetaString(meta, ["duration"], "") ||
      formatDuration(getMetaNumber(meta, ["duration_sec", "durationSec"], 0));

    const primaryTag = getMetaString(meta, ["category", "sport", "program"], "Library");
    const secondaryTag = getMetaString(meta, ["season", "level", "coach"], "Media");
    const itemsCount = getMetaNumber(meta, ["itemsCount", "items_count"], 1);
    const author = getMetaString(meta, ["coach", "author", "creator"], "Media Library");
    const docs = getMetaStringArray(meta, "docs");

    const resolvedPath = resolveArtifactSource(artifact, context);

    const metaThumbnail = getMetaString(meta, ["thumbnail"], "");
    const thumbnail = resolveArtifactPath(
      metaThumbnail ||
      thumbnailByLink.get(artifact.name) ||
      (mediaType === "image" ? resolvedPath : "")
    );

  return {
    id: artifact.name,
    title: artifact.title,
    format,
    author,
    createdAt,
    views,
      duration,
      primaryTag,
      secondaryTag,
      itemsCount,
      meta,
      mediaType,
      thumbnail,
      videoSrc: mediaType === "video" ? resolvedPath : undefined,
      fileSrc: mediaType === "document" ? resolvedPath : undefined,
      docs,
    };
  });
};

export const groupMediaItemsByTag = (
  items: TMediaItem[],
  fallbackTitle = "Library"
): TMediaSection[] => {
  const grouped = new Map<string, TMediaItem[]>();
  for (const item of items) {
    const key = item.primaryTag || fallbackTitle;
    const group = grouped.get(key);
    if (group) group.push(item);
    else grouped.set(key, [item]);
  }

  return Array.from(grouped.entries()).map(([title, sectionItems]) => ({
    title,
    items: sectionItems,
  }));
};
