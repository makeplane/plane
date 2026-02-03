"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Clock, FileText, Mail, MapPin, Phone, User } from "lucide-react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { API_BASE_URL } from "@plane/constants";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { resolveAttachmentDownloadUrl } from "@/components/issues/issue-detail-widgets/media-library-utils";
import { useMediaLibraryItems } from "../hooks/use-media-library-items";
import { TagsSection } from "../components/tags-section";
import { PLAYER_STYLE } from "./player-styles";
import { PlayerOverlay, PlayerSettingsPanel } from "./player-ui";


const formatMetaValue = (value: unknown) => {
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

const formatMetaLabel = (value: string) => {
  if (!value) return value;
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk[0]?.toUpperCase() + chunk.slice(1))
    .join(" ");
};

const getMetaString = (meta: Record<string, unknown>, keys: string[], fallback = "") => {
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
};

const getMetaNumber = (meta: Record<string, unknown>, keys: string[]) => {
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

const getMetaObject = (meta: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = meta[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  }
  return null;
};

const formatFileSize = (value: unknown) => {
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

const formatDateValue = (value?: string | null) => {
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

const formatTimeValue = (value?: string | null) => {
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

const resolveOppositionLogoUrl = (logo?: string | null) => {
  if (!logo) return "";
  if (/^https?:\/\//i.test(logo)) return logo;
  const base = process.env.NEXT_PUBLIC_CP_SERVER_URL?.replace(/\/$/, "") ?? "";
  if (!base) return "";
  return `${base}/blobs/${logo.replace(/^\/+/, "")}`;
};

const isMeaningfulValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "" && value !== "--";
  return true;
};

const DOCUMENT_PREVIEW_STYLE = `
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

const getVideoMimeType = (format: string) => {
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

const getVideoFormatFromSrc = (src: string) => {
  const match = src.toLowerCase().match(/\.(mp4|m4v|m3u8|mov|webm|avi|mkv|mpeg|mpg)(\?.*)?$/);
  return match?.[1] ?? "";
};

type TCaptionTrack = {
  src: string;
  label?: string;
  srclang?: string;
  kind?: "captions" | "subtitles";
  default?: boolean;
};

const getCaptionTracks = (meta: unknown): TCaptionTrack[] => {
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

const getVideoRepresentations = (player: any) => {
  const tech = player?.tech?.(true);
  const vhs = tech?.vhs;
  const reps = typeof vhs?.representations === "function" ? vhs.representations() : [];
  return Array.isArray(reps) ? reps : [];
};

const getQualitySelection = (representations: any[]) => {
  const enabled = representations.filter((rep) => rep?.enabled?.());
  if (enabled.length === 1) {
    return { isAuto: false, activeRep: enabled[0] };
  }
  return { isAuto: true, activeRep: null };
};

const buildDownloadUrl = (src: string) => {
  if (!src) return "";
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}download=1`;
};

const addInlineDisposition = (src: string) => {
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

const MediaDetailPage = () => {
  const { mediaId, workspaceSlug, projectId } = useParams() as {
    mediaId: string;
    workspaceSlug: string;
    projectId: string;
  };
  const { items: libraryItems, isLoading } = useMediaLibraryItems(workspaceSlug, projectId);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [textPreviewError, setTextPreviewError] = useState<string | null>(null);
  const [isTextPreviewLoading, setIsTextPreviewLoading] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewHtml, setDocumentPreviewHtml] = useState<string | null>(null);
  const [documentPreviewError, setDocumentPreviewError] = useState<string | null>(null);
  const [isDocumentPreviewLoading, setIsDocumentPreviewLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playerTick, setPlayerTick] = useState(0);
  const [qualitySelection, setQualitySelection] = useState<string | null>(null);
  const settingsPanelRef = useRef<HTMLDivElement | null>(null);
  const sanitizedDocumentPreviewHtml = useMemo(
    () => (documentPreviewHtml ? DOMPurify.sanitize(documentPreviewHtml, { USE_PROFILES: { html: true } }) : ""),
    [documentPreviewHtml]
  );

  const item = useMemo(() => {
    if (!mediaId) return null;
    const normalizedId = decodeURIComponent(mediaId);
    return libraryItems.find((entry) => entry.id === normalizedId) ?? null;
  }, [libraryItems, mediaId]);
  const meta = (item?.meta ?? {}) as Record<string, unknown>;
  const normalizedAction = (item?.action ?? "").toLowerCase();
  const documentFormat = item?.format?.toLowerCase() ?? "";
  const videoSrc = item?.videoSrc ?? item?.fileSrc ?? "";
  const [resolvedVideoSrc, setResolvedVideoSrc] = useState<string>("");
  const [resolvedDocumentSrc, setResolvedDocumentSrc] = useState<string>("");
  const [resolvedImageSrc, setResolvedImageSrc] = useState<string>("");
  const isVideoAssetApiUrl = useMemo(
    () =>
      Boolean(API_BASE_URL) &&
      typeof videoSrc === "string" &&
      videoSrc.startsWith(API_BASE_URL) &&
      videoSrc.includes("/api/assets/v2/"),
    [videoSrc]
  );
  const rawImageSrc = item?.mediaType === "image" ? item.thumbnail : "";
  const isImageAssetApiUrl = useMemo(
    () =>
      Boolean(API_BASE_URL) &&
      typeof rawImageSrc === "string" &&
      rawImageSrc.startsWith(API_BASE_URL) &&
      rawImageSrc.includes("/api/assets/v2/"),
    [rawImageSrc]
  );
  const isDocumentAssetApiUrl = useMemo(
    () =>
      Boolean(API_BASE_URL) &&
      typeof item?.fileSrc === "string" &&
      item.fileSrc.startsWith(API_BASE_URL) &&
      item.fileSrc.includes("/api/assets/v2/"),
    [item?.fileSrc]
  );
  const resolvedVideoFormat = documentFormat || getVideoFormatFromSrc(videoSrc);
  const isVideoAction = new Set(["play", "play_hls", "play_streaming", "open_mp4"]).has(normalizedAction);
  const isVideoFormat = new Set(["mp4", "m4v", "m3u8", "mov", "webm", "avi", "mkv", "mpeg", "mpg", "stream"]).has(
    resolvedVideoFormat
  );
  const isVideo = item?.mediaType === "video" || item?.linkedMediaType === "video" || isVideoAction || isVideoFormat;
  const isHls =
    isVideo &&
    (resolvedVideoFormat === "m3u8" ||
      resolvedVideoFormat === "stream" ||
      videoSrc.toLowerCase().includes(".m3u8") ||
      normalizedAction === "play_streaming" ||
      Boolean(meta?.hls));
  const proxiedVideoSrc = useMemo(() => {
    if (!videoSrc) return videoSrc;
    if (!isHls) return videoSrc;
    try {
      const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
      const url = new URL(videoSrc, base);
      if (url.origin === base) return videoSrc;
      return `/api/hls?url=${encodeURIComponent(url.toString())}`;
    } catch {
      return videoSrc;
    }
  }, [isHls, videoSrc]);
  const effectiveVideoSrc = isVideoAssetApiUrl ? resolvedVideoSrc : resolvedVideoSrc || proxiedVideoSrc || videoSrc;
  const effectiveImageSrc = isImageAssetApiUrl ? resolvedImageSrc : resolvedImageSrc || rawImageSrc;
  const credentialOrigins = useMemo(() => {
    const origins = new Set<string>();
    if (typeof window !== "undefined") {
      origins.add(window.location.origin);
    }
    if (API_BASE_URL) {
      try {
        origins.add(new URL(API_BASE_URL).origin);
      } catch {
        // ignore invalid API base URL
      }
    }
    return origins;
  }, []);
  const shouldUseCredentials = useCallback(
    (src: string) => {
      if (!src) return true;
      if (src.startsWith("/")) return true;
      if (!/^https?:\/\//i.test(src)) return true;
      try {
        const url = new URL(src);
        return credentialOrigins.has(url.origin);
      } catch {
        return true;
      }
    },
    [credentialOrigins]
  );
  const useCredentials = useMemo(
    () => shouldUseCredentials(effectiveVideoSrc),
    [effectiveVideoSrc, shouldUseCredentials]
  );
  const crossOrigin = useCredentials ? "use-credentials" : "anonymous";
  const videoDownloadSrc = videoSrc ? buildDownloadUrl(videoSrc) : "";
  const effectiveDocumentSrc = isDocumentAssetApiUrl ? resolvedDocumentSrc : resolvedDocumentSrc || item?.fileSrc || "";
  const useDocumentCredentials = useMemo(
    () => shouldUseCredentials(effectiveDocumentSrc),
    [effectiveDocumentSrc, shouldUseCredentials]
  );
  const isPdf = item?.mediaType === "document" && documentFormat === "pdf";
  const isTextDocument =
    item?.mediaType === "document" &&
    new Set(["txt", "csv", "json", "md", "log", "yaml", "yml", "xml"]).has(documentFormat);
  const isDocx = item?.mediaType === "document" && documentFormat === "docx";
  const isXlsx = item?.mediaType === "document" && new Set(["xlsx", "xls"]).has(documentFormat);
  const isPptx = item?.mediaType === "document" && documentFormat === "pptx";
  const isBinaryDocument = item?.mediaType === "document" && !isTextDocument;
  const isSupportedDocument = item?.mediaType === "document" && (isPdf || isXlsx);
  const isUnsupportedDocument = item?.mediaType === "document" && !isSupportedDocument;

  useEffect(() => {
    let isMounted = true;
    if (!isVideo || !videoSrc) {
      setResolvedVideoSrc("");
      return () => {
        isMounted = false;
      };
    }

    if (!isVideoAssetApiUrl) {
      setResolvedVideoSrc(videoSrc);
      return () => {
        isMounted = false;
      };
    }

    setResolvedVideoSrc("");
    const resolveUrl = async () => {
      try {
        const resolved = await resolveAttachmentDownloadUrl(addInlineDisposition(videoSrc));
        if (isMounted) setResolvedVideoSrc(resolved || videoSrc);
      } catch {
        if (isMounted) setResolvedVideoSrc(videoSrc);
      }
    };

    void resolveUrl();

    return () => {
      isMounted = false;
    };
  }, [isVideo, isVideoAssetApiUrl, videoSrc]);

  useEffect(() => {
    let isMounted = true;
    if (!rawImageSrc || item?.mediaType !== "image") {
      setResolvedImageSrc("");
      return () => {
        isMounted = false;
      };
    }

    if (!isImageAssetApiUrl) {
      setResolvedImageSrc(rawImageSrc);
      return () => {
        isMounted = false;
      };
    }

    setResolvedImageSrc("");
    const resolveUrl = async () => {
      try {
        const resolved = await resolveAttachmentDownloadUrl(addInlineDisposition(rawImageSrc));
        if (isMounted) setResolvedImageSrc(resolved || rawImageSrc);
      } catch {
        if (isMounted) setResolvedImageSrc(rawImageSrc);
      }
    };

    void resolveUrl();

    return () => {
      isMounted = false;
    };
  }, [isImageAssetApiUrl, item?.mediaType, rawImageSrc]);

  useEffect(() => {
    let isMounted = true;
    const fileSrc = item?.fileSrc;
    if (!item || item.mediaType !== "document" || !fileSrc) {
      setResolvedDocumentSrc("");
      return () => {
        isMounted = false;
      };
    }

    if (!isDocumentAssetApiUrl) {
      setResolvedDocumentSrc(fileSrc);
      return () => {
        isMounted = false;
      };
    }

    setResolvedDocumentSrc("");
    const resolveUrl = async () => {
      try {
        const resolved = await resolveAttachmentDownloadUrl(addInlineDisposition(fileSrc));
        if (isMounted) setResolvedDocumentSrc(resolved || fileSrc);
      } catch {
        if (isMounted) setResolvedDocumentSrc(fileSrc);
      }
    };

    void resolveUrl();

    return () => {
      isMounted = false;
    };
  }, [isDocumentAssetApiUrl, item?.fileSrc, item?.mediaType]);

  useEffect(() => {
    let isMounted = true;
    const fileSrc = effectiveDocumentSrc;
    if (!item || item.mediaType !== "document" || !fileSrc || !isTextDocument || isUnsupportedDocument) {
      setTextPreview(null);
      setTextPreviewError(null);
      setIsTextPreviewLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const loadTextPreview = async () => {
      try {
        setIsTextPreviewLoading(true);
        const response = await fetch(fileSrc, { credentials: useDocumentCredentials ? "include" : "omit" });
        if (!response.ok) {
          throw new Error(`Failed to load document preview (status ${response.status}).`);
        }
        const rawText = await response.text();
        let formattedText = rawText;
        if (documentFormat === "json") {
          try {
            formattedText = JSON.stringify(JSON.parse(rawText), null, 2);
          } catch {
            formattedText = rawText;
          }
        }
        if (isMounted) setTextPreview(formattedText);
      } catch (error) {
        if (isMounted) {
          setTextPreviewError(error instanceof Error ? error.message : "Unable to load preview.");
          setTextPreview(null);
        }
      } finally {
        if (isMounted) setIsTextPreviewLoading(false);
      }
    };

    void loadTextPreview();

    return () => {
      isMounted = false;
    };
  }, [documentFormat, effectiveDocumentSrc, isTextDocument, item?.mediaType, isUnsupportedDocument, useDocumentCredentials]);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;
    const fileSrc = effectiveDocumentSrc;

    if (!item || !fileSrc || !isBinaryDocument || isUnsupportedDocument) {
      setDocumentPreviewUrl(null);
      setDocumentPreviewHtml(null);
      setDocumentPreviewError(null);
      setIsDocumentPreviewLoading(false);
      return () => {
        isMounted = false;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }

    const loadBinaryPreview = async () => {
      try {
        setIsDocumentPreviewLoading(true);
        setDocumentPreviewError(null);
        setDocumentPreviewHtml(null);
        const response = await fetch(fileSrc, { credentials: useDocumentCredentials ? "include" : "omit" });
        if (!response.ok) {
          throw new Error(`Failed to load document preview (status ${response.status}).`);
        }
        const blob = await response.blob();
        if (isPptx) {
          throw new Error("Preview is not available for PowerPoint files.");
        }
        if (isDocx) {
          const mammothModule = await import("mammoth");
          const convertToHtml = mammothModule.convertToHtml ?? mammothModule.default?.convertToHtml;
          if (!convertToHtml) throw new Error("Document preview is unavailable.");
          const arrayBuffer = await blob.arrayBuffer();
          const result = await convertToHtml({ arrayBuffer });
          if (isMounted) setDocumentPreviewHtml(result.value);
          return;
        }
        if (isXlsx) {
          const xlsxModule = await import("xlsx");
          const XLSX = "default" in xlsxModule ? xlsxModule.default : xlsxModule;
          const arrayBuffer = await blob.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
          if (!sheet) throw new Error("Spreadsheet preview is unavailable.");
          const html = XLSX.utils.sheet_to_html(sheet);
          if (isMounted) setDocumentPreviewHtml(html);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        if (isMounted) setDocumentPreviewUrl(objectUrl);
      } catch (error) {
        if (isMounted) {
          setDocumentPreviewError(error instanceof Error ? error.message : "Unable to load preview.");
          setDocumentPreviewUrl(null);
          setDocumentPreviewHtml(null);
        }
      } finally {
        if (isMounted) setIsDocumentPreviewLoading(false);
      }
    };

    void loadBinaryPreview();

    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    effectiveDocumentSrc,
    isBinaryDocument,
    isDocx,
    isPptx,
    isUnsupportedDocument,
    isXlsx,
    item?.mediaType,
    useDocumentCredentials,
  ]);

  const handleTogglePip = useCallback(async () => {
    const video = videoRef.current as HTMLVideoElement | null;
    if (!video || typeof document === "undefined") return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if ((video as any).requestPictureInPicture) {
        await (video as any).requestPictureInPicture();
      }
    } catch {
      // ignore PiP errors
    }
  }, []);

  useEffect(() => {
    if (!isVideo) {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement || !videoElement.isConnected) return;

    if (playerRef.current && playerRef.current.el?.() !== videoElement) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    if (!playerRef.current) {
      const overflowButtonName = "OverflowMenuButton";
      const pipButtonName = "PipToggleButton";
      if (!videojs.getComponent(overflowButtonName)) {
        const Button = videojs.getComponent("Button");
        const OverflowMenuButton = class extends (Button as any) {
          constructor(playerInstance: any, options: any) {
            super(playerInstance, options);
            this.controlText("More");
            this.addClass("vjs-overflow-button");
            this.addClass("vjs-menu-button");
          }

          handleClick() {
            const playerInstance = this.player();
            playerInstance?.trigger?.("overflowtoggle");
          }
        };
        videojs.registerComponent(overflowButtonName, OverflowMenuButton as any);
      }
      if (!videojs.getComponent(pipButtonName)) {
        const Button = videojs.getComponent("Button");
        const PipToggleButton = class extends (Button as any) {
          constructor(playerInstance: any, options: any) {
            super(playerInstance, options);
            this.controlText("Picture in Picture");
            this.addClass("vjs-pip-toggle");
          }

          handleClick() {
            const playerInstance = this.player();
            playerInstance?.trigger?.("piptoggle");
          }
        };
        videojs.registerComponent(pipButtonName, PipToggleButton as any);
      }

      playerRef.current = videojs(videoElement, {
        controls: true,
        autoplay: true,
        preload: "metadata",
        playsinline: true,
        crossOrigin,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: {
            withCredentials: useCredentials,
          },
        },
        controlBar: {
          children: [
            "currentTimeDisplay",
            "progressControl",
            "durationDisplay",
            "volumePanel",
            "fullscreenToggle",
            "PipToggleButton",
            "OverflowMenuButton",
          ],
        },
      });

      const player = playerRef.current as any;
      if (!player) return;

      const Button = videojs.getComponent("Button");
      const MenuButton = videojs.getComponent("MenuButton");
      const MenuItem = videojs.getComponent("MenuItem");
      const controlBar = player.controlBar;
      if (controlBar && !controlBar.getChild("PipToggleButton")) {
        controlBar.addChild("PipToggleButton", {});
      }
      if (controlBar && !controlBar.getChild("OverflowMenuButton")) {
        controlBar.addChild("OverflowMenuButton", {});
      }

      let qualityButton: any = null;
      let qualityRetryId: ReturnType<typeof setTimeout> | null = null;
      const qualityButtonName = "QualityMenuButton";

      const ensureQualityMenu = () => {
        const representations = getVideoRepresentations(player);
        if (representations.length === 0 && isHls && !qualityRetryId) {
          qualityRetryId = setTimeout(() => {
            qualityRetryId = null;
            if (playerRef.current === player) ensureQualityMenu();
          }, 500);
        }
        if (representations.length === 0) {
          if (qualityButton && player.controlBar) {
            player.controlBar.removeChild(qualityButton);
            qualityButton = null;
          }
          return;
        }

        if (!videojs.getComponent(qualityButtonName)) {
          const QualityMenuItem = class extends (MenuItem as any) {
            rep?: any;
            isAuto: boolean;

            constructor(playerInstance: any, options: any) {
              super(playerInstance, options);
              this.rep = options?.rep;
              this.isAuto = Boolean(options?.isAuto);
              this.on("click", this.handleClick);
            }

            handleClick() {
              const playerInstance = this.player();
              const reps = getVideoRepresentations(playerInstance);
              if (!reps.length) return;
              if (this.isAuto) {
                reps.forEach((rep) => rep?.enabled?.(true));
              } else {
                reps.forEach((rep) => rep?.enabled?.(rep === this.rep));
              }
              playerInstance.trigger("qualitychange");
              const button = playerInstance?.controlBar?.getChild?.(qualityButtonName) as any;
              button?.update?.();
            }
          };

          const QualityMenuButton = class extends (MenuButton as any) {
            items: any[] = [];
            constructor(playerInstance: any, options: any) {
              super(playerInstance, options);
              this.controlText("Quality");
              this.addClass("vjs-quality-selector");
              this.addClass("vjs-icon-cog");
              this.addClass("vjs-menu-button-popup");
            }

            createItems() {
              const playerInstance = this.player();
              const reps = getVideoRepresentations(playerInstance);
              if (!reps.length) {
                return [
                  new QualityMenuItem(playerInstance, {
                    label: "Auto",
                    selectable: false,
                    selected: true,
                    isAuto: true,
                  }),
                ];
              }
              const { isAuto, activeRep } = getQualitySelection(reps);

              const sorted = reps
                .map((rep, index) => ({
                  rep,
                  height: rep?.height ?? 0,
                  bandwidth: rep?.bandwidth ?? rep?.bitrate ?? 0,
                  index,
                }))
                .sort((left, right) => {
                  if (left.height !== right.height) return right.height - left.height;
                  if (left.bandwidth !== right.bandwidth) return right.bandwidth - left.bandwidth;
                  return left.index - right.index;
                });

              const items = [
                new QualityMenuItem(playerInstance, {
                  label: "Auto",
                  selectable: true,
                  selected: isAuto,
                  isAuto: true,
                }),
              ];

              sorted.forEach(({ rep, height, bandwidth }) => {
                const label = height
                  ? `${height}p`
                  : bandwidth
                    ? `${Math.round(bandwidth / 1000)} kbps`
                    : "Source";
                items.push(
                  new QualityMenuItem(playerInstance, {
                    label,
                    selectable: true,
                    selected: !isAuto && activeRep === rep,
                    rep,
                    isAuto: false,
                  })
                );
              });

              this.items = items;
              return items;
            }

            update() {
              const reps = getVideoRepresentations(this.player());
              if (!reps.length) return;
              const { isAuto, activeRep } = getQualitySelection(reps);
              this.items?.forEach((item) => {
                if (item?.isAuto) {
                  item.selected?.(isAuto);
                } else if (item?.rep) {
                  item.selected?.(activeRep === item.rep);
                }
              });
            }
          };

          videojs.registerComponent(qualityButtonName, QualityMenuButton as any);
        }

        if (!qualityButton && player.controlBar) {
          qualityButton = player.controlBar.addChild(qualityButtonName, {});
          const fullscreenToggle = player.controlBar.getChild("FullscreenToggle");
          if (fullscreenToggle && qualityButton?.el && player.controlBar.el) {
            player.controlBar.el().insertBefore(qualityButton.el(), fullscreenToggle.el());
          }
        }

        qualityButton?.update?.();
      };

      player.ready(() => {
        ensureQualityMenu();
      });
      player.on("loadedmetadata", ensureQualityMenu);
      player.on("loadeddata", ensureQualityMenu);
      player.on("canplay", ensureQualityMenu);
      player.on("play", ensureQualityMenu);
      player.on("qualitychange", ensureQualityMenu);
      player.on("overflowtoggle", () => {
        setIsSettingsOpen((prev) => !prev);
      });
      player.on("piptoggle", () => {
        void handleTogglePip();
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [handleTogglePip, isHls, isVideo]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const handlePlayState = () => setIsPlaying(!player.paused());
    player.on("play", handlePlayState);
    player.on("pause", handlePlayState);
    player.on("ended", handlePlayState);
    player.on("loadedmetadata", handlePlayState);
    handlePlayState();
    return () => {
      player.off("play", handlePlayState);
      player.off("pause", handlePlayState);
      player.off("ended", handlePlayState);
      player.off("loadedmetadata", handlePlayState);
    };
  }, [isVideo, proxiedVideoSrc]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const handleChange = () => setPlayerTick((value) => value + 1);
    player.on("qualitychange", handleChange);
    player.on("ratechange", handleChange);
    return () => {
      player.off("qualitychange", handleChange);
      player.off("ratechange", handleChange);
    };
  }, [isVideo, proxiedVideoSrc]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const handleReady = () => setPlayerTick((value) => value + 1);
    player.on("loadedmetadata", handleReady);
    player.on("loadeddata", handleReady);
    player.on("canplay", handleReady);
    player.on("play", handleReady);
    return () => {
      player.off("loadedmetadata", handleReady);
      player.off("loadeddata", handleReady);
      player.off("canplay", handleReady);
      player.off("play", handleReady);
    };
  }, [isVideo, proxiedVideoSrc]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (settingsPanelRef.current?.contains(target)) return;
      if (target.closest(".vjs-overflow-button")) return;
      setIsSettingsOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSettingsOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isSettingsOpen]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !effectiveVideoSrc) return;
    const type = getVideoMimeType(resolvedVideoFormat);
    const source = type ? { src: effectiveVideoSrc, type } : { src: effectiveVideoSrc };
    player.src(source);
    player.poster(item?.thumbnail ?? "");
  }, [item?.thumbnail, effectiveVideoSrc, resolvedVideoFormat]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const tracks = getCaptionTracks(item?.meta);
    const existing = player.remoteTextTracks?.();
    if (existing && existing.length) {
      for (let i = existing.length - 1; i >= 0; i -= 1) {
        player.removeRemoteTextTrack(existing[i]);
      }
    }
    if (!tracks.length) return;
    tracks.forEach((track) => {
      player.addRemoteTextTrack(
        {
          kind: track.kind ?? "captions",
          src: track.src,
          srclang: track.srclang,
          label: track.label ?? "CC",
          default: track.default ?? false,
        },
        false
      );
    });
  }, [item?.meta]);

useEffect(() => {
    if (!isUnsupportedDocument) return;
    setTextPreview(null);
    setTextPreviewError(null);
    setIsTextPreviewLoading(false);
    setDocumentPreviewUrl(null);
    setDocumentPreviewHtml(null);
    setIsDocumentPreviewLoading(false);
    setDocumentPreviewError("Only PDF and XLSX files are supported.");
  }, [isUnsupportedDocument]);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.scrollIntoView({ behavior: "smooth", block: "center" });
    if (playerRef.current) {
      Promise.resolve(playerRef.current.play?.()).catch(() => undefined);
      return;
    }
    video.play().catch(() => undefined);
  }, []);

  const handleOverlayToggle = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.paused()) {
      Promise.resolve(player.play?.()).catch(() => undefined);
    } else {
      player.pause?.();
    }
  }, []);

  const handleOverlaySeek = useCallback((delta: number) => {
    const player = playerRef.current;
    if (!player) return;
    const current = player.currentTime() ?? 0;
    const seekable = player.seekable && player.seekable();
    let target = current + delta;
    const duration = player.duration?.();
    if (Number.isFinite(duration) && duration > 0) {
      target = Math.min(duration, Math.max(0, target));
    } else if (seekable && seekable.length) {
      const start = seekable.start(0);
      const end = seekable.end(0);
      target = Math.min(end, Math.max(start, target));
    } else {
      target = Math.max(0, target);
    }
    player.currentTime(target);
  }, []);

  const qualityOptions = useMemo(() => {
    const player = playerRef.current as any;
    if (!player) {
      return [{ key: "auto", label: "Auto", isAuto: true, selected: true, rep: null }];
    }
    const reps = getVideoRepresentations(player);
    if (!reps.length) {
      return [{ key: "auto", label: "Auto", isAuto: true, selected: true, rep: null, disabled: true }];
    }
    const { isAuto, activeRep } = getQualitySelection(reps);
    const sorted = reps
      .map((rep, index) => ({
        rep,
        height: rep?.height ?? 0,
        bandwidth: rep?.bandwidth ?? rep?.bitrate ?? 0,
        index,
      }))
      .sort((left, right) => {
        if (left.height !== right.height) return right.height - left.height;
        if (left.bandwidth !== right.bandwidth) return right.bandwidth - left.bandwidth;
        return left.index - right.index;
      });
    const items: Array<{
      key: string;
      label: string;
      isAuto: boolean;
      selected: boolean;
      rep: any;
      disabled?: boolean;
    }> = [];
    const fallbackSelected = qualitySelection === null ? (isAuto ? "auto" : null) : qualitySelection;
    if (sorted.length > 1) {
      items.push({
        key: "auto",
        label: "Auto",
        isAuto: true,
        selected: fallbackSelected === "auto" || (qualitySelection === null && isAuto),
        rep: null,
      });
    }
    sorted.forEach(({ rep, height, bandwidth }) => {
      const label = height ? `${height}p` : bandwidth ? `${Math.round(bandwidth / 1000)} kbps` : "Source";
      const key = `${label}-${bandwidth}-${height}-${rep?.id ?? ""}`;
      const isSelected =
        qualitySelection === key ||
        (qualitySelection === null && !isAuto && activeRep === rep);
      items.push({
        key,
        label,
        isAuto: false,
        selected: isSelected,
        rep,
      });
    });
    if (sorted.length === 1 && !items.some((item) => item.selected)) {
      items[0].selected = true;
    }
    return items;
  }, [playerTick, qualitySelection]);

  const playbackRates = useMemo(() => {
    const player = playerRef.current as any;
    const rates = player?.playbackRates?.();
    return Array.isArray(rates) && rates.length ? rates : [0.5, 0.75, 1, 1.25, 1.5, 2];
  }, [playerTick]);

  const currentPlaybackRate = useMemo(() => {
    const player = playerRef.current as any;
    const rate = player?.playbackRate?.();
    return typeof rate === "number" ? rate : 1;
  }, [playerTick]);

  const handleQualitySelect = useCallback((option: { isAuto: boolean; rep: any; key?: string }) => {
    const player = playerRef.current as any;
    if (!player) return;
    const reps = getVideoRepresentations(player);
    if (!reps.length) return;
    if (option.isAuto) {
      reps.forEach((rep) => rep?.enabled?.(true));
      setQualitySelection("auto");
    } else {
      reps.forEach((rep) => rep?.enabled?.(rep === option.rep));
      if (option.key) setQualitySelection(option.key);
    }
    player.trigger("qualitychange");
    setPlayerTick((value) => value + 1);
  }, []);

  const handlePlaybackRate = useCallback((rate: number) => {
    const player = playerRef.current as any;
    if (!player) return;
    player.playbackRate(rate);
    setPlayerTick((value) => value + 1);
  }, []);
  if (!item && isLoading) {
    return (
      <div className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
        <div className="flex flex-col items-center gap-2">
          <LogoSpinner />
          <span>Loading media...</span>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="rounded-lg border border-dashed border-custom-border-200 bg-custom-background-100 p-6 text-center text-sm text-custom-text-300">
        Media not found.
      </div>
    );
  }
  const category = getMetaString(meta, ["category", "event_category"], "");
  const sport = getMetaString(meta, ["sport"], "");
  const program = getMetaString(meta, ["program"], "");
  const level = getMetaString(meta, ["level"], "");
  const season = getMetaString(meta, ["season"], "");
  const source = getMetaString(meta, ["source"], "");
  const createdBy = getMetaString(meta, ["created_by", "createdBy"], "");
  const startDate = getMetaString(meta, ["start_date", "startDate"], "");
  const startTime = getMetaString(meta, ["start_time", "startTime"], "");
  const fileType = getMetaString(meta, ["file_type", "fileType"], "");
  const fileSize = getMetaNumber(meta, ["file_size", "fileSize"]);
  const kind = getMetaString(meta, ["kind"], "");
  const opposition = getMetaObject(meta, ["opposition"]);
  const oppositionName = opposition ? getMetaString(opposition, ["name", "title"], "") : "";
  const oppositionLogo = opposition ? getMetaString(opposition, ["logo"], "") : "";
  const oppositionAddress = opposition ? getMetaString(opposition, ["address"], "") : "";
  const oppositionHeadCoach = opposition ? getMetaString(opposition, ["head_coach_name"], "") : "";
  const oppositionAsstCoach = opposition ? getMetaString(opposition, ["asst_coach_name"], "") : "";
  const oppositionAthleticEmail = opposition ? getMetaString(opposition, ["athletic_email"], "") : "";
  const oppositionAthleticPhone = opposition ? getMetaString(opposition, ["athletic_phone"], "") : "";
  const oppositionAsstAthleticEmail = opposition ? getMetaString(opposition, ["asst_athletic_email"], "") : "";
  const oppositionAsstAthleticPhone = opposition ? getMetaString(opposition, ["asst_athletic_phone"], "") : "";
  const hasOppositionDetails = Boolean(
    oppositionName ||
      oppositionLogo ||
      oppositionAddress ||
      oppositionHeadCoach ||
      oppositionAsstCoach ||
      oppositionAthleticEmail ||
      oppositionAthleticPhone ||
      oppositionAsstAthleticEmail ||
      oppositionAsstAthleticPhone
  );
  const createdByLabel = createdBy || item.author;
  const eventDateLabel = startDate
    ? formatDateValue(startDate)
    : startTime
      ? formatDateValue(startTime)
      : item.createdAt;
  const eventTimeLabel = startTime ? formatTimeValue(startTime) : "";
  const fileTypeLabel = fileType || item.format;
  const fileSizeLabel = formatFileSize(fileSize);
  const oppositionLogoUrl = resolveOppositionLogoUrl(oppositionLogo);
  const displayKeyExclusions = new Set([
    "duration",
    "duration_sec",
    "durationSec",
    "category",
    "event_category",
    "sport",
    "program",
    "level",
    "season",
    "source",
    "created_by",
    "createdBy",
    "start_date",
    "startDate",
    "start_time",
    "startTime",
    "file_type",
    "fileType",
    "file_size",
    "fileSize",
    "kind",
    "opposition",
  ]);
  const metaEntries = Object.entries(meta)
    .filter(([key]) => !displayKeyExclusions.has(key))
    .sort(([left], [right]) => left.localeCompare(right));
  const durationLabel = formatMetaValue(meta.duration ?? item.duration);
  const durationSecLabel = formatMetaValue(meta.duration_sec ?? meta.durationSec);

  return (
    <div className="flex flex-col gap-6 px-3 py-3">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/${workspaceSlug}/projects/${projectId}/media-library`}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs text-custom-text-300 hover:text-custom-text-100"
        >
          <ArrowLeft className="size-md h-3.2 w-3.2" />
        </Link>


        {/* Currently not using this section */}

        
        {/* <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-1 py-1 text-[11px] text-custom-text-300">
            <button
              type="button"
              className="rounded-full border border-custom-border-200 px-3 py-1 hover:text-custom-text-100"
            >
              View 1
            </button>
            <button
              type="button"
              className="rounded-full border border-custom-border-200 px-3 py-1 hover:text-custom-text-100"
            >
              View 2
            </button>
            <button
              type="button"
              className="rounded-full border border-custom-border-200 px-3 py-1 hover:text-custom-text-100"
            >
              View 3
            </button>
          </div>
        </div> */}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg  bg-custom-background-100 p-4 ">
          {isVideo ? (
            <>
              <div className="media-player mx-auto h-[505px] w-100 max-w-full overflow-hidden rounded-lg border border-custom-border-200 bg-black">
                <video
                  ref={videoRef}
                  className="video-js vjs-default-skin h-full w-full"
                  poster={item.thumbnail}
                  playsInline
                  preload="metadata"
                  crossOrigin={crossOrigin}
                />
                <PlayerOverlay isPlaying={isPlaying} onToggle={handleOverlayToggle} onSeek={handleOverlaySeek} />
                <PlayerSettingsPanel
                  isOpen={isSettingsOpen}
                  onClose={() => setIsSettingsOpen(false)}
                  qualityOptions={qualityOptions}
                  playbackRates={playbackRates}
                  currentPlaybackRate={currentPlaybackRate}
                  onSelectQuality={handleQualitySelect}
                  onSelectRate={handlePlaybackRate}
                  panelRef={settingsPanelRef}
                />
                <style jsx global>{PLAYER_STYLE}</style>
              </div>
              {videoDownloadSrc ? (
                <div className="flex justify-end border-t border-custom-border-200 p-3">
                  <a
                    href={videoDownloadSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-custom-border-200 px-3 py-1 text-xs text-custom-text-300 hover:text-custom-text-100"
                  >
                    Download video
                  </a>
                </div>
              ) : null}
            </>
          ) : item.mediaType === "image" ? (
            <div className="overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-90">
              <button
                type="button"
                className="h-full w-full cursor-zoom-in"
                onClick={() => {
                  setIsImageZoomOpen(true);
                }}
                aria-label="Zoom image"
              >
                {effectiveImageSrc ? (
                  <img
                    src={effectiveImageSrc}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-[505px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[505px] w-full items-center justify-center text-xs text-custom-text-300">
                    Loading image...
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-custom-border-200 bg-custom-background-90">
              {isUnsupportedDocument ? (
                <div className="flex h-[505px] items-center justify-center rounded-lg bg-custom-background-100 text-xs text-custom-text-300">
                  Only PDF and XLSX files are supported.
                </div>
              ) : isBinaryDocument ? (
                <div className="h-[505px] rounded-lg bg-custom-background-100">
                  {isDocumentPreviewLoading ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-custom-text-300">
                      <LogoSpinner />
                      <span>Loading preview...</span>
                    </div>
                  ) : documentPreviewError ? (
                    <div className="flex h-full items-center justify-center text-xs text-custom-text-300">
                      {documentPreviewError}
                    </div>
                  ) : documentPreviewHtml ? (
                    <div className="h-full overflow-auto rounded-lg bg-white p-4">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `${DOCUMENT_PREVIEW_STYLE}<div class="document-preview">${sanitizedDocumentPreviewHtml}</div>`,
                        }}
                      />
                    </div>
                  ) : documentPreviewUrl ? (
                    <iframe src={documentPreviewUrl} title={item.title} className="h-full w-full rounded-lg bg-white" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-custom-text-300">
                      No preview available for this file.
                    </div>
                  )}
                </div>
              ) : isTextDocument ? (
                <div className="h-[505px] overflow-auto rounded-lg bg-custom-background-100 p-4 text-xs text-custom-text-100">
                  {isTextPreviewLoading ? (
                    <div className="flex flex-col items-center gap-2 text-custom-text-300">
                      <LogoSpinner />
                      <span>Loading preview...</span>
                    </div>
                  ) : textPreviewError ? (
                    <div className="text-custom-text-300">{textPreviewError}</div>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words">{textPreview}</pre>
                  )}
                </div>
              ) : effectiveDocumentSrc ? (
                <iframe src={effectiveDocumentSrc} title={item.title} className="h-[505px] w-full rounded-lg bg-white" />
              ) : (
                <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-lg text-custom-text-300">
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <FileText className="h-8 w-8" />
                    <span>No preview available for this file.</span>
                  </div>
                </div>
              )}
              {effectiveDocumentSrc && !isUnsupportedDocument ? (
                <div className="flex justify-end border-t border-custom-border-200 p-3">
                  <a
                    href={effectiveDocumentSrc}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-custom-border-200 px-3 py-1 text-xs text-custom-text-300 hover:text-custom-text-100"
                  >
                    Open document
                  </a>
                </div>
              ) : null}
            </div>
          )}
          <div className="mt-4">
            <h1 className="text-lg font-semibold text-custom-text-100">{item.title}</h1>
            <p className="mt-1 text-xs text-custom-text-300">
              Uploaded by {createdByLabel} - {item.createdAt}
            </p>
            {item.description ? (
              <p className="mt-2 text-sm text-custom-text-200">{item.description}</p>
            ) : null}
          </div>
          <hr className="border-t border-custom-border-200" />
        </div>

        {isImageZoomOpen && item.mediaType === "image" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setIsImageZoomOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setIsImageZoomOpen(false)}
              className="absolute right-4 top-4 rounded-full border border-white/30 px-3 py-1 text-xs text-white hover:border-white"
            >
              Close
            </button>
            {effectiveImageSrc ? (
              <img src={effectiveImageSrc} alt={item.title} className="h-[90vh] w-[90vw] object-contain" />
            ) : (
              <div className="flex h-[90vh] w-[90vw] items-center justify-center text-xs text-white">
                Loading image...
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 rounded-2xl border border-custom-border-200 bg-custom-background-100 p-4">
          <div className="flex items-center gap-2 rounded-full border border-custom-border-200 bg-custom-background-90 p-1 text-[11px] text-custom-text-300">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`rounded-full px-3 py-1 ${activeTab === "details"
                  ? "border border-custom-border-200 bg-custom-background-100 text-custom-text-100"
                  : "hover:text-custom-text-100"
                }`}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tags")}
              className={`rounded-full px-3 py-1 ${
                activeTab === "tags"
                  ? "border border-custom-border-200 bg-custom-background-100 text-custom-text-100"
                  : "hover:text-custom-text-100"
              }`}
            >
              Tags
            </button>
          </div>

          {activeTab === "details" ? (
            <>
              <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                  Event details
                </div>
                <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                  {isMeaningfulValue(eventDateLabel) ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{eventDateLabel}</span>
                    </div>
                  ) : null}
                  {isMeaningfulValue(eventTimeLabel) ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{eventTimeLabel}</span>
                    </div>
                  ) : null}
                  {isMeaningfulValue(category) ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-custom-text-200">Category</span>
                      <span className="text-right">{category}</span>
                    </div>
                  ) : null}
                  {isMeaningfulValue(season) ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-custom-text-200">Season</span>
                      <span className="text-right">{season}</span>
                    </div>
                  ) : null}
                  {isMeaningfulValue(createdByLabel) ? (
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>{createdByLabel}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {isMeaningfulValue(sport) || isMeaningfulValue(program) || isMeaningfulValue(level) ? (
                <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                  <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                    Team details
                  </div>
                  <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                    {isMeaningfulValue(sport) ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-custom-text-200">Sport</span>
                        <span className="text-right">{sport}</span>
                      </div>
                    ) : null}
                    {isMeaningfulValue(program) ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-custom-text-200">Program</span>
                        <span className="text-right">{program}</span>
                      </div>
                    ) : null}
                    {isMeaningfulValue(level) ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-custom-text-200">Level</span>
                        <span className="text-right">{level}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {opposition && hasOppositionDetails ? (
                <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                  <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                    Opposition
                  </div>
                  <div className="space-y-3 px-4 py-3 text-xs text-custom-text-300">
                    {oppositionName || oppositionLogoUrl ? (
                      <div className="flex items-center gap-3">
                        {oppositionLogoUrl ? (
                          <img
                            src={oppositionLogoUrl}
                            alt={oppositionName || "Opposition logo"}
                            className="h-10 w-10 rounded-full border border-custom-border-200 object-cover"
                          />
                        ) : null}
                        <div className="text-sm font-semibold text-custom-text-100">
                          {oppositionName || "Opposition team"}
                        </div>
                      </div>
                    ) : null}
                    {oppositionHeadCoach ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-custom-text-200">Head coach</span>
                        <span className="text-right">{oppositionHeadCoach}</span>
                      </div>
                    ) : null}
                    {oppositionAsstCoach ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-custom-text-200">Assistant coach</span>
                        <span className="text-right">{oppositionAsstCoach}</span>
                      </div>
                    ) : null}
                    {oppositionAthleticEmail ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <a
                          href={`mailto:${oppositionAthleticEmail}`}
                          className="text-custom-text-200 hover:text-custom-text-100"
                        >
                          {oppositionAthleticEmail}
                        </a>
                      </div>
                    ) : null}
                    {oppositionAthleticPhone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <a
                          href={`tel:${oppositionAthleticPhone}`}
                          className="text-custom-text-200 hover:text-custom-text-100"
                        >
                          {oppositionAthleticPhone}
                        </a>
                      </div>
                    ) : null}
                    {oppositionAsstAthleticEmail ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <a
                          href={`mailto:${oppositionAsstAthleticEmail}`}
                          className="text-custom-text-200 hover:text-custom-text-100"
                        >
                          {oppositionAsstAthleticEmail}
                        </a>
                      </div>
                    ) : null}
                    {oppositionAsstAthleticPhone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <a
                          href={`tel:${oppositionAsstAthleticPhone}`}
                          className="text-custom-text-200 hover:text-custom-text-100"
                        >
                          {oppositionAsstAthleticPhone}
                        </a>
                      </div>
                    ) : null}
                    {oppositionAddress ? (
                      <div className="flex items-start gap-2 text-custom-text-200">
                        <MapPin className="mt-0.5 h-3.5 w-3.5" />
                        <span className="leading-relaxed">{oppositionAddress}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {item.mediaType === "video" ? (
                <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                  <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                    Duration &amp; sharing
                  </div>
                  <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                    <div className="flex items-center justify-between">
                      <span>Duration</span>
                      <span>{durationLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Duration (sec)</span>
                      <span>{durationSecLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shared with</span>
                      <span>--</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {item.docs.length > 0 ? (
                <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                  <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                    Documents
                  </div>
                  <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                    {item.docs.map((doc) => (
                      <div key={doc} className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                  Media info
                </div>
                <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                  {isMeaningfulValue(fileTypeLabel) ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-custom-text-200">File type</span>
                      <span className="text-right">{formatMetaValue(fileTypeLabel)}</span>
                    </div>
                  ) : null}
                  {isMeaningfulValue(fileSizeLabel) ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-custom-text-200">File size</span>
                      <span className="text-right">{fileSizeLabel}</span>
                    </div>
                  ) : null}
                  {isMeaningfulValue(source) ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-custom-text-200">Source</span>
                      <span className="text-right">{source}</span>
                    </div>
                  ) : null}
                  {isMeaningfulValue(kind) ? (
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-custom-text-200">Kind</span>
                      <span className="text-right">{kind}</span>
                    </div>
                  ) : null}
                  {metaEntries.length < 0 ? (
                    <div className="text-xs text-custom-text-400">No metadata available.</div>
                  ) : (
                    metaEntries.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <span className="truncate text-custom-text-200">{formatMetaLabel(key)}</span>
                        <span className="max-w-[55%] truncate text-right">{formatMetaValue(value)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <TagsSection item={item} onPlay={handlePlay} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaDetailPage;
