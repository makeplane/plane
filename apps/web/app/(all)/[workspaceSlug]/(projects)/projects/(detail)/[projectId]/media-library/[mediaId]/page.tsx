"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import Link from "next/link";
import { useParams } from "next/navigation";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { ArrowLeft, Calendar, FileText, User } from "lucide-react";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { useMediaLibraryItems } from "../(list)/use-media-library-items";
import { TagsSection } from "./tags-section";

const formatMetaValue = (value: unknown) => {
  if (value === null || value === undefined) return "--";
  if (typeof value === "string") return value.trim() ? value : "--";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
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
  const videoDownloadSrc = videoSrc ? buildDownloadUrl(videoSrc) : "";
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
    const fileSrc = item?.fileSrc;
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
        const response = await fetch(fileSrc, { credentials: "include" });
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
  }, [documentFormat, isTextDocument, item?.fileSrc, item?.mediaType]);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;
    const fileSrc = item?.fileSrc;

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
        const response = await fetch(fileSrc, { credentials: "include" });
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
  }, [isBinaryDocument, isDocx, isPptx, isUnsupportedDocument, isXlsx, item?.fileSrc, item?.mediaType]);

  useEffect(() => {
    if (!isVideo) {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      return;
    }

    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!playerRef.current) {
      playerRef.current = videojs(videoElement, {
        controls: true,
        autoplay: true,
        preload: "auto",
        playsinline: true,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: {
            withCredentials: true,
          },
        },
        controlBar: {
          progressControl: true,
          playToggle: true,
          volumePanel: true,
          currentTimeDisplay: true,
          timeDivider: true,
          durationDisplay: true,
          playbackRateMenuButton: true,
          fullscreenToggle: true,
        },
      });

      const player = playerRef.current as any;
      if (!player) return;

      const Button = videojs.getComponent("Button");
      const MenuButton = videojs.getComponent("MenuButton");
      const MenuItem = videojs.getComponent("MenuItem");

      const ensureSkipButtons = () => {
        const SkipBase = class extends (Button as any) {
          seconds: number;
          constructor(playerInstance: any, options: any) {
            super(playerInstance, options);
            this.seconds = options?.seconds ?? 0;
            const label = this.seconds > 0 ? `+${this.seconds}s` : `${this.seconds}s`;
            this.controlText(`Skip ${label}`);
            this.addClass("vjs-skip-button");
            this.addClass(this.seconds > 0 ? "vjs-skip-forward" : "vjs-skip-backward");
            this.el().textContent = "";
            this.addClass(this.seconds > 0 ? "vjs-icon-next-item" : "vjs-icon-previous-item");
          }

          handleClick() {
            const playerInstance = this.player();
            if (!playerInstance) return;
            const current = playerInstance.currentTime() ?? 0;
            const seekable = playerInstance.seekable && playerInstance.seekable();
            let target = current + this.seconds;
            const duration = playerInstance.duration?.();
            if (Number.isFinite(duration) && duration > 0) {
              target = Math.min(duration, Math.max(0, target));
            } else if (seekable && seekable.length) {
              const start = seekable.start(0);
              const end = seekable.end(0);
              target = Math.min(end, Math.max(start, target));
            } else {
              target = Math.max(0, target);
            }
            playerInstance.currentTime(target);
            const afterSet = playerInstance.currentTime() ?? 0;
            if (Math.abs(afterSet - target) < 0.1) return;
            if (!Number.isFinite(duration) && (!seekable || !seekable.length)) {
              const readyState = playerInstance.readyState?.() ?? 0;
              if (readyState < 1) {
                const pendingTarget = target;
                const retrySeek = () => {
                  const nextDuration = playerInstance.duration?.();
                  const nextTarget =
                    Number.isFinite(nextDuration) && nextDuration > 0
                      ? Math.min(nextDuration, Math.max(0, pendingTarget))
                      : Math.max(0, pendingTarget);
                  playerInstance.currentTime(nextTarget);
                };
                playerInstance.one("loadedmetadata", retrySeek);
                playerInstance.one("canplay", retrySeek);
              }
            }
          }
        };

        const skipBackName = "SkipBack5";
        const skipForwardName = "SkipForward5";

        if (!videojs.getComponent(skipBackName)) {
          const SkipBack = class extends SkipBase {};
          videojs.registerComponent(skipBackName, SkipBack as any);
        }
        if (!videojs.getComponent(skipForwardName)) {
          const SkipForward = class extends SkipBase {};
          videojs.registerComponent(skipForwardName, SkipForward as any);
        }

        const controlBar = player.controlBar;
        if (!controlBar) return;

        if (!controlBar.getChild(skipBackName)) {
          const children = controlBar.children();
          let playToggleIndex = children.findIndex((child: any) => child?.name?.() === "PlayToggle");
          const baseIndex = playToggleIndex >= 0 ? playToggleIndex : 0;
          // Add skip back before play toggle.
          controlBar.addChild(skipBackName, { seconds: -5 }, baseIndex);
          // Recompute play toggle index since children shifted.
          playToggleIndex = controlBar.children().findIndex((child: any) => child?.name?.() === "PlayToggle");
          const forwardIndex = playToggleIndex >= 0 ? playToggleIndex + 1 : controlBar.children().length;
          controlBar.addChild(skipForwardName, { seconds: 5 }, forwardIndex);
        }
      };

      player.ready(() => {
        ensureSkipButtons();
      });
      player.on("loadedmetadata", ensureSkipButtons);

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
      void MenuButton;
      void MenuItem;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [isVideo, isHls]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !proxiedVideoSrc) return;
    const type = getVideoMimeType(resolvedVideoFormat);
    const source = type ? { src: proxiedVideoSrc, type } : { src: proxiedVideoSrc };
    player.src(source);
    player.poster(item?.thumbnail ?? "");
  }, [item?.thumbnail, proxiedVideoSrc, resolvedVideoFormat]);

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
  const metaEntries = Object.entries(meta)
    .filter(([key]) => key !== "duration_sec" && key !== "durationSec")
    .sort(([left], [right]) => left.localeCompare(right));
  const durationLabel = formatMetaValue(meta.duration ?? item.duration);
  const durationSecLabel = formatMetaValue(meta.duration_sec ?? meta.durationSec);

  console.log("Rendering MediaDetailPage for item:", item);

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
                  preload="auto"
                  crossOrigin="use-credentials"
                />
                <style jsx global>{`
                  .media-player .video-js .vjs-control-bar {
                    display: flex;
                    align-items: center;
                  }
                  .media-player .video-js .vjs-control {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .media-player .video-js .vjs-control .vjs-icon-placeholder {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                  }
                  .media-player .video-js .vjs-quality-selector,
                  .media-player .video-js .vjs-hls-quality-selector,
                  .media-player .video-js .vjs-quality-menu,
                  .media-player .video-js .vjs-menu-button.vjs-icon-cog {
                    height: 100%;
               
                    padding: 0;
                    line-height: 1;
                    margin-left: 8px;
                  }
                  .media-player .video-js .vjs-quality-selector .vjs-icon-placeholder:before,
                  .media-player .video-js .vjs-hls-quality-selector .vjs-icon-placeholder:before,
                  .media-player .video-js .vjs-quality-menu .vjs-icon-placeholder:before,
                  .media-player .video-js .vjs-menu-button.vjs-icon-cog .vjs-icon-placeholder:before {
                    line-height: 1;
                    display: block;
                  }
                  .media-player .video-js .vjs-quality-selector .vjs-icon-placeholder:before,
                  .media-player .video-js .vjs-hls-quality-selector .vjs-icon-placeholder:before,
                  .media-player .video-js .vjs-quality-menu .vjs-icon-placeholder:before,
                  .media-player .video-js .vjs-menu-button.vjs-icon-cog .vjs-icon-placeholder:before {
                    transform: translateX(2px);
                  }
                  .media-player .video-js .vjs-live-control,
                  .media-player .video-js .vjs-live-display,
                  .media-player .video-js .vjs-live,
                  .media-player .video-js .vjs-live-button {
                    display: none !important;
                  }
                  .media-player .video-js .vjs-control-bar [class*="live"] {
                    display: none !important;
                  }
                `}</style>
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
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  className="h-[505px] w-full object-cover"
                />
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
              ) : item.fileSrc ? (
                <iframe src={item.fileSrc} title={item.title} className="h-[505px] w-full rounded-lg bg-white" />
              ) : (
                <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-lg text-custom-text-300">
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <FileText className="h-8 w-8" />
                    <span>No preview available for this file.</span>
                  </div>
                </div>
              )}
              {item.fileSrc && !isUnsupportedDocument ? (
                <div className="flex justify-end border-t border-custom-border-200 p-3">
                  <a
                    href={item.fileSrc}
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
              Uploaded by {item.author} - {item.createdAt}
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
            <img src={item.thumbnail} alt={item.title} className="h-[90vh] w-[90vw] object-contain" />
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
            {/* <button
              type="button"
              onClick={() => setActiveTab("tags")}
              className={`rounded-full px-3 py-1 ${
                activeTab === "tags"
                  ? "border border-custom-border-200 bg-custom-background-100 text-custom-text-100"
                  : "hover:text-custom-text-100"
              }`}
            >
              Tags
            </button> */}
          </div>

          {activeTab === "details" ? (
            <>
              <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
                <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
                  Event details
                </div>
                <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{item.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>{item.author}</span>
                  </div>
                </div>
              </div>

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
                  {metaEntries.length === 0 ? (
                    <div className="text-xs text-custom-text-400">No metadata available.</div>
                  ) : (
                    metaEntries.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <span className="truncate text-custom-text-200">{key}</span>
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
