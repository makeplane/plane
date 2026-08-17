"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Download, FileText, FileWarning, Pencil } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import { ImageFullScreenModal } from "@plane/editor";
import { Button, EModalWidth, ModalCore } from "@plane/ui";
import { LogoSpinner } from "@/components/common/logo-spinner";
import {
  buildDownloadUrl,
  DOCUMENT_PREVIEW_STYLE,
  getDisplayMediaTitle,
  getMetaNumber,
} from "../utils/media-detail-utils";
import { PlayerOverlay, PlayerSettingsPanel } from "./player-ui";
import type { TQualityOption } from "./player-ui";

type TMediaDetailPreviewProps = {
  item: any;
  isVideo: boolean;
  isImageZoomOpen: boolean;
  setIsImageZoomOpen: (open: boolean) => void;
  videoRef: RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  canAnnotateVideo?: boolean;
  isVideoAnnotationMode?: boolean;
  isVideoAnnotationWorkspaceOpen?: boolean;
  onOverlayToggle: () => void;
  onOverlaySeek: (delta: number) => void;
  onOpenVideoAnnotationWorkspace?: () => void;
  onCloseVideoAnnotationWorkspace?: () => boolean | Promise<boolean>;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  qualityOptions: TQualityOption[];
  playbackRates: number[];
  currentPlaybackRate: number;
  onSelectQuality: (option: TQualityOption) => void;
  onSelectRate: (rate: number) => void;
  settingsPanelRef: RefObject<HTMLDivElement>;
  crossOrigin: "anonymous" | "use-credentials" | "" | undefined;
  playerElement: HTMLElement | null;
  videoAnnotationContent?: ReactNode;
  onVideoAnnotationPropertiesElementChange?: (element: HTMLDivElement | null) => void;
  onVideoAnnotationToolbarElementChange?: (element: HTMLDivElement | null) => void;
  onVideoTimelineElementChange?: (element: HTMLDivElement | null) => void;
  showVideoTimeline?: boolean;
  effectiveImageSrc: string;
  isUnsupportedDocument: boolean;
  isBinaryDocument: boolean;
  isDocumentPreviewLoading: boolean;
  documentPreviewError: string | null;
  documentPreviewHtml: string | null;
  sanitizedDocumentPreviewHtml: string;
  documentPreviewUrl: string | null;
  isTextDocument: boolean;
  isTextPreviewLoading: boolean;
  textPreviewError: string | null;
  textPreview: string | null;
  effectiveDocumentSrc: string;
  description: string | null;
  createdByLabel: string;
  createdAt: string;
};

const VIDEO_ANNOTATION_FLOATING_ACTION_CLASS =
  "!absolute !right-4 !top-4 !z-30 !inline-flex !h-10 !w-auto !min-w-[118px] !items-center !justify-center !gap-2 !rounded-[7px] !border !px-3.5 !text-[13px] !font-semibold !leading-none !shadow-[0_14px_34px_rgba(0,0,0,0.38)] !backdrop-blur-md !transition-[background-color,border-color,color,box-shadow,transform] hover:!-translate-y-0.5 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-custom-primary-100/40 focus-visible:!ring-offset-2 focus-visible:!ring-offset-black active:!translate-y-0";
const VIDEO_ANNOTATION_HEADER_ACTION_CLASS =
  "inline-flex h-9 min-w-[118px] items-center justify-center gap-2 rounded-[7px] border border-custom-primary-100 bg-custom-primary-100 px-3.5 text-[13px] font-semibold leading-none text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-custom-primary-100/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100/40 focus-visible:ring-offset-2 focus-visible:ring-offset-custom-background-100 active:translate-y-0";

export const MediaDetailPreview = ({
  item,
  isVideo,
  isImageZoomOpen,
  setIsImageZoomOpen,
  videoRef,
  isPlaying,
  canAnnotateVideo = false,
  isVideoAnnotationWorkspaceOpen = false,
  onOverlayToggle,
  onOverlaySeek,
  onOpenVideoAnnotationWorkspace,
  onCloseVideoAnnotationWorkspace,
  isSettingsOpen,
  onCloseSettings,
  qualityOptions,
  playbackRates,
  currentPlaybackRate,
  onSelectQuality,
  onSelectRate,
  settingsPanelRef,
  playerElement,
  crossOrigin,
  videoAnnotationContent,
  onVideoAnnotationPropertiesElementChange,
  onVideoAnnotationToolbarElementChange,
  onVideoTimelineElementChange,
  showVideoTimeline = false,
  effectiveImageSrc,
  isUnsupportedDocument,
  isBinaryDocument,
  isDocumentPreviewLoading,
  documentPreviewError,
  documentPreviewHtml,
  sanitizedDocumentPreviewHtml,
  documentPreviewUrl,
  isTextDocument,
  isTextPreviewLoading,
  textPreviewError,
  textPreview,
  effectiveDocumentSrc,
}: TMediaDetailPreviewProps) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isImagePreviewBroken, setIsImagePreviewBroken] = useState(false);
  const [isVideoPreviewBroken, setIsVideoPreviewBroken] = useState(false);
  const [isDocumentPreviewBroken, setIsDocumentPreviewBroken] = useState(false);
  const [isVideoAnnotationDoneModalOpen, setIsVideoAnnotationDoneModalOpen] = useState(false);
  const [isCompletingVideoAnnotation, setIsCompletingVideoAnnotation] = useState(false);
  const [viewport, setViewport] = useState(() => {
    if (typeof window === "undefined") {
      return { width: 0, height: 0 };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  });
  const displayTitle = getDisplayMediaTitle(item?.title);
  const handleVideoTimelineElement = useCallback(
    (element: HTMLDivElement | null) => {
      onVideoTimelineElementChange?.(element);
    },
    [onVideoTimelineElementChange]
  );
  const handleVideoAnnotationToolbarElement = useCallback(
    (element: HTMLDivElement | null) => {
      onVideoAnnotationToolbarElementChange?.(element);
    },
    [onVideoAnnotationToolbarElementChange]
  );
  const handleVideoAnnotationPropertiesElement = useCallback(
    (element: HTMLDivElement | null) => {
      onVideoAnnotationPropertiesElementChange?.(element);
    },
    [onVideoAnnotationPropertiesElementChange]
  );
  const handleRequestCloseVideoAnnotationWorkspace = useCallback(() => {
    setIsVideoAnnotationDoneModalOpen(true);
  }, []);
  const handleConfirmCloseVideoAnnotationWorkspace = useCallback(async () => {
    if (!onCloseVideoAnnotationWorkspace || isCompletingVideoAnnotation) return;

    setIsCompletingVideoAnnotation(true);
    try {
      const didClose = await onCloseVideoAnnotationWorkspace();
      if (didClose !== false) {
        setIsVideoAnnotationDoneModalOpen(false);
      }
    } finally {
      setIsCompletingVideoAnnotation(false);
    }
  }, [isCompletingVideoAnnotation, onCloseVideoAnnotationWorkspace]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    setImageDimensions(null);
  }, [effectiveImageSrc]);

  useEffect(() => {
    setIsImagePreviewBroken(false);
    setIsVideoPreviewBroken(false);
    setIsDocumentPreviewBroken(false);
  }, [effectiveDocumentSrc, effectiveImageSrc, item?.id, item?.videoSrc]);

  useEffect(() => {
    if (isVideoAnnotationWorkspaceOpen) return;

    setIsVideoAnnotationDoneModalOpen(false);
    setIsCompletingVideoAnnotation(false);
  }, [isVideoAnnotationWorkspaceOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const overlayContent = (
    <>
      <PlayerOverlay isPlaying={isPlaying} onToggle={onOverlayToggle} onSeek={onOverlaySeek} />
      <PlayerSettingsPanel
        isOpen={isSettingsOpen}
        onClose={onCloseSettings}
        qualityOptions={qualityOptions}
        playbackRates={playbackRates}
        currentPlaybackRate={currentPlaybackRate}
        onSelectQuality={onSelectQuality}
        onSelectRate={onSelectRate}
        panelRef={settingsPanelRef}
      />
    </>
  );
  const annotationWorkspaceToggleContent = (
    <>
      {canAnnotateVideo && !isVideoAnnotationWorkspaceOpen ? (
        <button
          type="button"
          onClick={onOpenVideoAnnotationWorkspace}
          className={`${VIDEO_ANNOTATION_FLOATING_ACTION_CLASS} !border-custom-primary-100 !bg-custom-primary-100 !text-white hover:!bg-custom-primary-100/90`}
          aria-label="Open annotation editor"
          title="Open annotation editor"
        >
          <Pencil className="!h-4 !w-4 !shrink-0" />
          <span className="!whitespace-nowrap !leading-none">Annotate</span>
        </button>
      ) : null}
    </>
  );
  const playerLayerContent = (
    <>
      {overlayContent}
      {videoAnnotationContent}
      {annotationWorkspaceToggleContent}
    </>
  );

  const previewHeight = useMemo(() => {
    if (!viewport.height) return 505;

    const isDesktopViewport = viewport.width >= 1025;
    const isTabletViewport = viewport.width >= 768;

    if (isDesktopViewport) {
      const scaledHeight = Math.round(viewport.height * 0.68);
      return Math.min(820, Math.max(520, scaledHeight));
    }

    if (isTabletViewport) {
      const scaledHeight = Math.round(viewport.height * 0.56);
      return Math.min(640, Math.max(420, scaledHeight));
    }

    const scaledHeight = Math.round(viewport.height * 0.38);
    return Math.min(420, Math.max(220, scaledHeight));
  }, [viewport.height, viewport.width]);
  const videoPreviewHeight = useMemo(() => {
    if (!viewport.height) return 620;

    const isDesktopViewport = viewport.width >= 1025;
    const isTabletViewport = viewport.width >= 768;

    if (isVideoAnnotationWorkspaceOpen) {
      if (isDesktopViewport) {
        return Math.min(860, Math.max(500, viewport.height - 360));
      }

      if (isTabletViewport) {
        return Math.min(680, Math.max(380, viewport.height - 330));
      }

      return Math.min(500, Math.max(260, viewport.height - 310));
    }

    if (isDesktopViewport) {
      const scaledHeight = Math.round(viewport.height * (showVideoTimeline ? 0.56 : 0.78));
      return Math.min(showVideoTimeline ? 700 : 920, Math.max(showVideoTimeline ? 420 : 620, scaledHeight));
    }

    if (isTabletViewport) {
      const scaledHeight = Math.round(viewport.height * (showVideoTimeline ? 0.52 : 0.64));
      return Math.min(showVideoTimeline ? 600 : 740, Math.max(showVideoTimeline ? 380 : 500, scaledHeight));
    }

    const scaledHeight = Math.round(viewport.height * 0.44);
    return Math.min(480, Math.max(260, scaledHeight));
  }, [isVideoAnnotationWorkspaceOpen, showVideoTimeline, viewport.height, viewport.width]);
  const previewHeightStyle: CSSProperties = { height: `${previewHeight}px` };
  const videoPreviewHeightStyle: CSSProperties = { height: `${videoPreviewHeight}px` };
  const overlayVisibilityClass = [isSettingsOpen ? "is-settings-open" : "", !isPlaying ? "is-paused" : ""]
    .filter(Boolean)
    .join(" ");
  const meta = (item?.meta ?? {}) as Record<string, unknown>;
  const metaWidth = getMetaNumber(meta, ["width", "image_width", "imageWidth", "w"]);
  const metaHeight = getMetaNumber(meta, ["height", "image_height", "imageHeight", "h"]);
  const rawWidth = imageDimensions?.width ?? metaWidth;
  const rawHeight = imageDimensions?.height ?? metaHeight;
  const resolvedImageWidth = rawWidth && rawWidth > 0 ? rawWidth : 1200;
  const resolvedImageHeight = rawHeight && rawHeight > 0 ? rawHeight : 900;
  const resolvedAspectRatio = resolvedImageHeight > 0 ? resolvedImageWidth / resolvedImageHeight : 1;
  const modalWidth = (() => {
    if (!viewport.width || !viewport.height || !Number.isFinite(resolvedAspectRatio) || resolvedAspectRatio <= 0) {
      return resolvedImageWidth;
    }
    const maxWidth = viewport.width * 0.9;
    const maxHeight = viewport.height * 0.75;
    const fittedWidth = Math.min(maxWidth, maxHeight * resolvedAspectRatio);
    return Math.max(320, Math.round(fittedWidth));
  })();
  const rawImageSrc = item?.mediaType === "image" ? item.thumbnail : "";
  const isWorkItemAttachment = meta.source === "work_item_attachment";
  const downloadCandidate = item?.downloadSrc || rawImageSrc || effectiveImageSrc;
  const isMediaLibraryDownload =
    typeof downloadCandidate === "string" &&
    (downloadCandidate.includes("/media-library/") ||
      (downloadCandidate.includes("/packages/") &&
        downloadCandidate.includes("/artifacts/") &&
        downloadCandidate.includes("/file")));
  const isApiAssetSrc =
    typeof rawImageSrc === "string" &&
    (rawImageSrc.includes("/api/assets/") || rawImageSrc.includes("/api/assets/v2/"));
  const downloadBaseSrc =
    isWorkItemAttachment || (isMediaLibraryDownload && isApiAssetSrc)
      ? rawImageSrc || effectiveImageSrc
      : downloadCandidate;
  const isAbsoluteDownloadSrc = /^https?:\/\//i.test(downloadBaseSrc);
  const isApiDownloadSrc =
    Boolean(downloadBaseSrc) && (!isAbsoluteDownloadSrc || (API_BASE_URL && downloadBaseSrc.startsWith(API_BASE_URL)));
  const imageDownloadSrc = downloadBaseSrc
    ? isApiDownloadSrc
      ? buildDownloadUrl(downloadBaseSrc)
      : downloadBaseSrc
    : "";
  const documentDownloadCandidate = item?.downloadSrc || item?.fileSrc || effectiveDocumentSrc;
  const isAbsoluteDocumentDownloadSrc = /^https?:\/\//i.test(documentDownloadCandidate);
  const isApiDocumentDownloadSrc =
    Boolean(documentDownloadCandidate) &&
    (!isAbsoluteDocumentDownloadSrc || (Boolean(API_BASE_URL) && documentDownloadCandidate.startsWith(API_BASE_URL)));
  const documentDownloadSrc = documentDownloadCandidate
    ? isApiDocumentDownloadSrc
      ? buildDownloadUrl(documentDownloadCandidate)
      : documentDownloadCandidate
    : "";
  const isDocumentCorrupted =
    (isBinaryDocument && (Boolean(documentPreviewError) || isDocumentPreviewBroken)) ||
    (isTextDocument && Boolean(textPreviewError)) ||
    (!isBinaryDocument && !isTextDocument && Boolean(effectiveDocumentSrc) && isDocumentPreviewBroken);
  const imagePreviewAvailable = Boolean(effectiveImageSrc) && !isImagePreviewBroken;
  const renderUnavailablePreview = (title: string, message: string, className: string, style?: CSSProperties) => (
    <div
      className={`flex ${className} flex-col items-center justify-center gap-2 rounded-lg bg-custom-background-100 px-4 text-center`}
      style={style}
      role="status"
      aria-live="polite"
    >
      <FileWarning className="h-32 w-32 text-custom-text-300" />
      <span className="text-xl font-medium text-custom-text-100">{title}</span>
    </div>
  );

  return (
    <>
      <div
        className={
          isVideoAnnotationWorkspaceOpen && isVideo
            ? "h-full min-h-0 bg-transparent p-0"
            : "rounded-lg bg-custom-background-100 p-3 sm:p-4"
        }
      >
        {isVideo ? (
          <>
            {isVideoAnnotationWorkspaceOpen ? (
              <div className="mb-2 flex h-11 w-full items-center justify-end rounded-lg border border-custom-border-200 bg-custom-background-100 px-3">
                <button
                  type="button"
                  onClick={handleRequestCloseVideoAnnotationWorkspace}
                  className={VIDEO_ANNOTATION_HEADER_ACTION_CLASS}
                  aria-label="Close annotation editor"
                  title="Close annotation editor"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap leading-none">Done</span>
                </button>
              </div>
            ) : null}
            <div className="flex w-full max-w-full items-start gap-2">
              {showVideoTimeline ? (
                <div
                  ref={handleVideoAnnotationToolbarElement}
                  className="flex w-10 shrink-0 justify-center overflow-y-auto overflow-x-hidden rounded-lg border border-custom-border-200 bg-custom-background-90 py-2"
                  style={videoPreviewHeightStyle}
                  aria-label="Annotation tools"
                />
              ) : null}
              <div
                className={`media-player relative min-w-0 flex-1 overflow-hidden rounded-lg border border-custom-border-200 bg-black ${overlayVisibilityClass}`}
                style={videoPreviewHeightStyle}
              >
                <video
                  ref={videoRef}
                  className={`video-js vjs-default-skin h-full w-full ${isVideoPreviewBroken ? "opacity-0" : ""}`}
                  poster={item.thumbnail}
                  playsInline
                  preload="auto"
                  crossOrigin={crossOrigin}
                  onLoadedData={() => setIsVideoPreviewBroken(false)}
                  onError={() => setIsVideoPreviewBroken(true)}
                />
                {playerElement ? createPortal(playerLayerContent, playerElement) : playerLayerContent}
                {isVideoPreviewBroken ? (
                  <div className="pointer-events-none absolute inset-0 z-20">
                    {renderUnavailablePreview(
                      "Video is not available",
                      "This video cannot be previewed right now.",
                      "h-full w-full border-0"
                    )}
                  </div>
                ) : null}
              </div>
              {showVideoTimeline ? (
                <div
                  ref={handleVideoAnnotationPropertiesElement}
                  className="flex w-[154px] shrink-0 overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-90 p-2"
                  style={videoPreviewHeightStyle}
                  aria-label="Annotation properties"
                />
              ) : null}
            </div>
            {showVideoTimeline ? <div ref={handleVideoTimelineElement} className="mt-3" /> : null}
          </>
        ) : item.mediaType === "image" ? (
          <div
            className="overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-90"
            style={previewHeightStyle}
          >
            <button
              type="button"
              className={`h-full w-full bg-custom-background-100 ${imagePreviewAvailable ? "cursor-zoom-in" : "cursor-default"}`}
              onClick={() => {
                if (!imagePreviewAvailable) return;
                setIsImageZoomOpen(true);
              }}
              aria-label={imagePreviewAvailable ? "Zoom image" : "Image preview unavailable"}
            >
              {effectiveImageSrc ? (
                imagePreviewAvailable ? (
                  <img
                    src={effectiveImageSrc}
                    alt={displayTitle}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                    onLoad={(event) => {
                      const target = event.currentTarget;
                      if (!target.naturalWidth || !target.naturalHeight) return;
                      setImageDimensions({ width: target.naturalWidth, height: target.naturalHeight });
                      setIsImagePreviewBroken(false);
                    }}
                    onError={() => setIsImagePreviewBroken(true)}
                  />
                ) : (
                  renderUnavailablePreview(
                    "Image is not available",
                    "This image cannot be previewed right now.",
                    "h-full w-full"
                  )
                )
              ) : (
                renderUnavailablePreview(
                  "Image is not available",
                  "This image cannot be previewed right now.",
                  "h-full w-full"
                )
              )}
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-custom-border-200 bg-custom-background-90">
            {isUnsupportedDocument ? (
              <div
                className="flex items-center justify-center rounded-lg bg-custom-background-100 text-xs text-custom-text-300"
                style={previewHeightStyle}
              >
                Only PDF, DOCX, XLSX, CSV, and text files are supported.
              </div>
            ) : isBinaryDocument ? (
              isDocumentPreviewLoading ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-lg bg-custom-background-100 text-xs text-custom-text-300"
                  style={previewHeightStyle}
                >
                  <LogoSpinner />
                  <span>Loading preview...</span>
                </div>
              ) : documentPreviewError || isDocumentPreviewBroken ? (
                renderUnavailablePreview(
                  "Document is not available",
                  documentPreviewError || "This document cannot be previewed right now.",
                  "w-full",
                  previewHeightStyle
                )
              ) : documentPreviewHtml ? (
                <div className="overflow-hidden rounded-lg bg-white" style={previewHeightStyle}>
                  <iframe
                    title={`${displayTitle}-preview`}
                    className="h-full w-full"
                    sandbox=""
                    srcDoc={`<!doctype html><html><head>${DOCUMENT_PREVIEW_STYLE}</head><body><div class="document-preview">${sanitizedDocumentPreviewHtml}</div></body></html>`}
                  />
                </div>
              ) : documentPreviewUrl ? (
                <iframe
                  src={documentPreviewUrl}
                  title={displayTitle}
                  className="h-full w-full rounded-lg bg-white"
                  style={previewHeightStyle}
                  onLoad={() => setIsDocumentPreviewBroken(false)}
                  onError={() => setIsDocumentPreviewBroken(true)}
                />
              ) : (
                <div
                  className="flex items-center justify-center text-xs text-custom-text-300"
                  style={previewHeightStyle}
                >
                  No preview available for this file.
                </div>
              )
            ) : isTextDocument ? (
              isTextPreviewLoading ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-lg bg-custom-background-100 text-xs text-custom-text-300"
                  style={previewHeightStyle}
                >
                  <LogoSpinner />
                  <span>Loading preview...</span>
                </div>
              ) : textPreviewError ? (
                renderUnavailablePreview(
                  "Document is not available",
                  textPreviewError || "This document cannot be previewed right now.",
                  "w-full",
                  previewHeightStyle
                )
              ) : (
                <div
                  className="overflow-auto rounded-lg bg-custom-background-100 p-4 text-xs text-custom-text-100"
                  style={previewHeightStyle}
                >
                  <pre className="whitespace-pre-wrap break-words">{textPreview}</pre>
                </div>
              )
            ) : effectiveDocumentSrc ? (
              isDocumentPreviewBroken ? (
                renderUnavailablePreview(
                  "Document is not available",
                  "This document cannot be previewed right now.",
                  "w-full",
                  previewHeightStyle
                )
              ) : (
                <iframe
                  src={effectiveDocumentSrc}
                  title={displayTitle}
                  className="w-full rounded-lg bg-white"
                  style={previewHeightStyle}
                  onLoad={() => setIsDocumentPreviewBroken(false)}
                  onError={() => setIsDocumentPreviewBroken(true)}
                />
              )
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-lg text-custom-text-300"
                style={previewHeightStyle}
              >
                <div className="flex flex-col items-center gap-2 text-sm">
                  <FileText className="h-8 w-8" />
                  <span>Document is not available.</span>
                </div>
              </div>
            )}
            {documentDownloadSrc && !isUnsupportedDocument && !isDocumentCorrupted ? (
              <div className="flex justify-end border-t border-custom-border-200 p-3">
                <a
                  href={documentDownloadSrc}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="inline-flex items-center gap-3 rounded-md bg-custom-primary-100 px-2 py-1 text-sm font-medium text-custom-100"
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <Download className="h-4 w-4" />
                  </span>
                  Download
                </a>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {item.mediaType === "image" && imagePreviewAvailable ? (
        <ImageFullScreenModal
          aspectRatio={resolvedAspectRatio}
          downloadSrc={imageDownloadSrc}
          isFullScreenEnabled={isImageZoomOpen}
          isTouchDevice={isTouchDevice}
          src={effectiveImageSrc}
          toggleFullScreenMode={setIsImageZoomOpen}
          width={`${modalWidth}px`}
        />
      ) : null}
      <ModalCore
        isOpen={isVideoAnnotationDoneModalOpen}
        handleClose={() => {
          if (isCompletingVideoAnnotation) return;
          setIsVideoAnnotationDoneModalOpen(false);
        }}
        width={EModalWidth.XL}
      >
        <div className="flex flex-col gap-2 px-5 py-4">
          <h3 className="text-lg font-medium text-custom-text-100">Done with annotations?</h3>
          <p className="text-sm leading-5 text-custom-text-200">
            Are you sure you are done with the annotated changes? Your annotation changes will be saved before leaving
            the editor.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-custom-border-200 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => setIsVideoAnnotationDoneModalOpen(false)}
            disabled={isCompletingVideoAnnotation}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              void handleConfirmCloseVideoAnnotationWorkspace();
            }}
            loading={isCompletingVideoAnnotation}
          >
            Done
          </Button>
        </div>
      </ModalCore>
    </>
  );
};
