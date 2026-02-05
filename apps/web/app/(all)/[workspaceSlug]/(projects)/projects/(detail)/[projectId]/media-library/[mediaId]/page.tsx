"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { useMediaLibraryItems } from "../hooks/use-media-library-items";
import { PLAYER_STYLE } from "./player-styles";
import { useDocumentPreview, useResolvedMediaSources } from "./media-detail-hooks";
import { MediaDetailPreview } from "./media-detail-preview";
import { MediaDetailSidebar } from "./media-detail-sidebar";
import {
  formatDateValue,
  formatFileSize,
  formatMetaValue,
  formatTimeValue,
  getCaptionTracks,
  getMetaNumber,
  getMetaObject,
  getMetaString,
  getQualitySelection,
  getVideoMimeType,
  getVideoRepresentations,
  isMeaningfulValue,
  resolveOppositionLogoUrl,
} from "./media-detail-utils";

const MediaDetailPage = () => {
  const { mediaId, workspaceSlug, projectId } = useParams() as {
    mediaId: string;
    workspaceSlug: string;
    projectId: string;
  };
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") ?? "";
  const backHref = useMemo(() => {
    const defaultHref = `/${workspaceSlug}/projects/${projectId}/media-library`;
    if (!fromParam || !fromParam.startsWith("/") || fromParam.startsWith("//")) return defaultHref;
    if (!fromParam.startsWith(defaultHref)) return defaultHref;
    return fromParam;
  }, [fromParam, projectId, workspaceSlug]);
  const { items: libraryItems, isLoading } = useMediaLibraryItems(workspaceSlug, projectId);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playerTick, setPlayerTick] = useState(0);
  const [qualitySelection, setQualitySelection] = useState<string | null>(null);
  const [playerElement, setPlayerElement] = useState<HTMLElement | null>(null);
  const settingsPanelRef = useRef<HTMLDivElement | null>(null);
  const pipCaptionModesRef = useRef<Array<{ track: TextTrack; mode: TextTrackMode }>>([]);
  const inactivityTimeoutRef = useRef<number | null>(null);

  const item = useMemo(() => {
    if (!mediaId) return null;
    const normalizedId = decodeURIComponent(mediaId);
    return libraryItems.find((entry) => entry.id === normalizedId) ?? null;
  }, [libraryItems, mediaId]);
  const meta = (item?.meta ?? {}) as Record<string, unknown>;
  const normalizedAction = (item?.action ?? "").toLowerCase();
  const documentFormat = item?.format?.toLowerCase() ?? "";
  const {
    resolvedVideoFormat,
    isVideoAction,
    isVideoFormat,
    isVideo,
    isHls,
    proxiedVideoSrc,
    effectiveVideoSrc,
    effectiveImageSrc,
    effectiveDocumentSrc,
    useCredentials,
    crossOrigin,
    useDocumentCredentials,
    videoDownloadSrc,
  } = useResolvedMediaSources({
    item,
    meta,
    documentFormat,
    normalizedAction,
  });
  console.log("Resolved Media Sources:", crossOrigin, useCredentials);
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

  const {
    textPreview,
    textPreviewError,
    isTextPreviewLoading,
    documentPreviewUrl,
    documentPreviewHtml,
    documentPreviewError,
    isDocumentPreviewLoading,
  } = useDocumentPreview({
    item,
    documentFormat,
    effectiveDocumentSrc,
    isTextDocument,
    isBinaryDocument,
    isUnsupportedDocument,
    isDocx,
    isXlsx,
    isPptx,
    useDocumentCredentials,
  });

  const sanitizedDocumentPreviewHtml = useMemo(
    () => (documentPreviewHtml ? DOMPurify.sanitize(documentPreviewHtml, { USE_PROFILES: { html: true } }) : ""),
    [documentPreviewHtml]
  );

  const handleTogglePip = useCallback(async () => {
    const video = videoRef.current as HTMLVideoElement | null;
    if (!video || typeof document === "undefined") return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if ((video as any).requestPictureInPicture) {
        await (video as any).requestPictureInPicture();
      }
    } catch (error) {
      console.error("Picture-in-Picture error:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Picture-in-Picture failed",
        message: "Your browser blocked Picture-in-Picture or it isn't supported for this media.",
      });
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
        nativeTextTracks: false,
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        html5: {
          vhs: {
            withCredentials: useCredentials,
            overrideNative: true,
          },
          nativeTextTracks: false,
        },
        controlBar: {
          children: [
            "currentTimeDisplay",
            "progressControl",
            "durationDisplay",
            "volumePanel",
            "subsCapsButton",
            "fullscreenToggle",
            "PipToggleButton",
            "OverflowMenuButton",
          ],
        },
      });

      const player = playerRef.current as any;
      if (!player) return;
      const resolvedPlayerElement = (() => {
        const element = player?.el?.() as HTMLElement | undefined;
        if (!element) return null;
        if (element.tagName.toLowerCase() === "video") return element.parentElement;
        return element;
      })();
      setPlayerElement(resolvedPlayerElement ?? null);

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
        const hasRealQualityInfo = representations.some((rep) => {
          const height = typeof rep?.height === "number" ? rep.height : 0;
          const bandwidth =
            typeof rep?.bandwidth === "number" ? rep.bandwidth : typeof rep?.bitrate === "number" ? rep.bitrate : 0;
          return height > 0 || bandwidth > 0;
        });
        if (representations.length === 0 && isHls && !qualityRetryId) {
          qualityRetryId = setTimeout(() => {
            qualityRetryId = null;
            if (playerRef.current === player) ensureQualityMenu();
          }, 500);
        }
        if (!hasRealQualityInfo) {
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
                const label = height ? `${height}p` : bandwidth ? `${Math.round(bandwidth / 1000)} kbps` : "Source";
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
      setPlayerElement(null);
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
    const player = playerRef.current as any;
    if (!player) return;
    if (!isSettingsOpen) {
      if (inactivityTimeoutRef.current !== null && typeof player.inactivityTimeout === "function") {
        player.inactivityTimeout(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      return;
    }

    if (typeof player.inactivityTimeout === "function") {
      if (inactivityTimeoutRef.current === null) {
        inactivityTimeoutRef.current = player.inactivityTimeout();
      }
      player.inactivityTimeout(0);
    }

    const keepControlsActive = () => {
      if (typeof player.userActive === "function") {
        player.userActive(true);
      }
      player.addClass?.("vjs-user-active");
      player.removeClass?.("vjs-user-inactive");
      player.controlBar?.show?.();
    };

    keepControlsActive();
    player.on?.("userinactive", keepControlsActive);
    return () => {
      player.off?.("userinactive", keepControlsActive);
    };
  }, [isSettingsOpen, isVideo, proxiedVideoSrc]);

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
    const trackList = existing as { length?: number; item?: (index: number) => TextTrack | null } | undefined;
    const trackCount = typeof trackList?.length === "number" ? trackList.length : 0;
    if (trackCount && typeof trackList?.item === "function") {
      for (let i = trackCount - 1; i >= 0; i -= 1) {
        const track = trackList.item(i);
        if (track) player.removeRemoteTextTrack(track);
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
    if (!isVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPip = () => {
      const tracks = video.textTracks;
      if (!tracks || tracks.length === 0) return;
      const previousModes: Array<{ track: TextTrack; mode: TextTrackMode }> = [];
      for (let i = 0; i < tracks.length; i += 1) {
        const track = tracks[i];
        if (track && (track.kind === "captions" || track.kind === "subtitles")) {
          previousModes.push({ track, mode: track.mode });
          track.mode = "showing";
        }
      }
      pipCaptionModesRef.current = previousModes;
    };

    const handleLeavePip = () => {
      pipCaptionModesRef.current.forEach(({ track, mode }) => {
        try {
          track.mode = mode;
        } catch {}
      });
      pipCaptionModesRef.current = [];
    };

    video.addEventListener("enterpictureinpicture", handleEnterPip);
    video.addEventListener("leavepictureinpicture", handleLeavePip);
    return () => {
      video.removeEventListener("enterpictureinpicture", handleEnterPip);
      video.removeEventListener("leavepictureinpicture", handleLeavePip);
    };
  }, [isVideo]);

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
    if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
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
      const isSelected = qualitySelection === key || (qualitySelection === null && !isAuto && activeRep === rep);
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
    <div className="relative h-full w-full overflow-hidden overflow-y-auto">
      <div className="flex min-h-full flex-col gap-6 px-3 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
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
          <MediaDetailPreview
            item={item}
            isVideo={isVideo}
            isImageZoomOpen={isImageZoomOpen}
            setIsImageZoomOpen={setIsImageZoomOpen}
            videoRef={videoRef}
            isPlaying={isPlaying}
            onOverlayToggle={handleOverlayToggle}
            onOverlaySeek={handleOverlaySeek}
            isSettingsOpen={isSettingsOpen}
            onCloseSettings={() => setIsSettingsOpen(false)}
            qualityOptions={qualityOptions}
            playbackRates={playbackRates}
            currentPlaybackRate={currentPlaybackRate}
            onSelectQuality={handleQualitySelect}
            onSelectRate={handlePlaybackRate}
            settingsPanelRef={settingsPanelRef}
            playerElement={playerElement}
            crossOrigin={crossOrigin}
            videoDownloadSrc={videoDownloadSrc}
            effectiveImageSrc={effectiveImageSrc}
            isUnsupportedDocument={isUnsupportedDocument}
            isBinaryDocument={isBinaryDocument}
            isDocumentPreviewLoading={isDocumentPreviewLoading}
            documentPreviewError={documentPreviewError}
            documentPreviewHtml={documentPreviewHtml}
            sanitizedDocumentPreviewHtml={sanitizedDocumentPreviewHtml}
            documentPreviewUrl={documentPreviewUrl}
            isTextDocument={isTextDocument}
            isTextPreviewLoading={isTextPreviewLoading}
            textPreviewError={textPreviewError}
            textPreview={textPreview}
            effectiveDocumentSrc={effectiveDocumentSrc}
            description={item.description ?? null}
            createdByLabel={createdByLabel}
            createdAt={item.createdAt}
          />
          {isVideo ? (
            <style jsx global>
              {PLAYER_STYLE}
            </style>
          ) : null}

          <MediaDetailSidebar
            item={item}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            eventDateLabel={eventDateLabel}
            eventTimeLabel={eventTimeLabel}
            category={category}
            season={season}
            createdByLabel={createdByLabel}
            sport={sport}
            program={program}
            level={level}
            opposition={opposition}
            oppositionName={oppositionName}
            oppositionLogoUrl={oppositionLogoUrl}
            oppositionHeadCoach={oppositionHeadCoach}
            oppositionAsstCoach={oppositionAsstCoach}
            oppositionAthleticEmail={oppositionAthleticEmail}
            oppositionAthleticPhone={oppositionAthleticPhone}
            oppositionAsstAthleticEmail={oppositionAsstAthleticEmail}
            oppositionAsstAthleticPhone={oppositionAsstAthleticPhone}
            oppositionAddress={oppositionAddress}
            hasOppositionDetails={hasOppositionDetails}
            fileTypeLabel={fileTypeLabel}
            fileSizeLabel={fileSizeLabel}
            source={source}
            kind={kind}
            metaEntries={metaEntries}
            durationLabel={durationLabel}
            durationSecLabel={durationSecLabel}
            onPlay={handlePlay}
          />
        </div>
      </div>
    </div>
  );
};

export default MediaDetailPage;
