"use client";

import type { RefObject } from "react";
import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ImageFullScreenModal } from "@plane/editor";
import { API_BASE_URL } from "@plane/constants";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PlayerOverlay, PlayerSettingsPanel } from "./player-ui";
import type { TQualityOption } from "./player-ui";
import { buildDownloadUrl, DOCUMENT_PREVIEW_STYLE, getMetaNumber } from "./media-detail-utils";

type TMediaDetailPreviewProps = {
  item: any;
  isVideo: boolean;
  isImageZoomOpen: boolean;
  setIsImageZoomOpen: (open: boolean) => void;
  videoRef: RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  onOverlayToggle: () => void;
  onOverlaySeek: (delta: number) => void;
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
  videoDownloadSrc: string;
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

export const MediaDetailPreview = ({
  item,
  isVideo,
  isImageZoomOpen,
  setIsImageZoomOpen,
  videoRef,
  isPlaying,
  onOverlayToggle,
  onOverlaySeek,
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
  videoDownloadSrc,
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
  description,
  createdByLabel,
  createdAt,
}: TMediaDetailPreviewProps) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    setImageDimensions(null);
  }, [effectiveImageSrc]);

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

  const previewHeightClass = "h-[220px] sm:h-[320px] md:h-[420px] lg:h-[505px]";
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

  return (
    <>
      <div className="rounded-lg bg-custom-background-100 p-3 sm:p-4">
        {isVideo ? (
          <>
            <div
              className={`media-player mx-auto ${previewHeightClass} w-full max-w-full overflow-hidden rounded-lg border border-custom-border-200 bg-black ${overlayVisibilityClass}`}
            >
              <video
                ref={videoRef}
                className="video-js vjs-default-skin h-full w-full"
                poster={item.thumbnail}
                playsInline
                preload="metadata"
                crossOrigin={crossOrigin}
              />
              {playerElement ? createPortal(overlayContent, playerElement) : overlayContent}
            </div>
            {videoDownloadSrc ? (
              <div className="flex justify-end border-t border-custom-border-200 p-3">
                <a
                  href={videoDownloadSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 rounded-md bg-custom-primary-100 px-2 py-1 text-sm font-medium text-custom-100"
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <Download className="h-4 w-4" />
                  </span>
                  Download
                </a>
              </div>
            ) : null}
          </>
        ) : item.mediaType === "image" ? (
          <div
            className={`overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-90 ${previewHeightClass}`}
          >
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
                  className="h-full w-full object-cover"
                  onLoad={(event) => {
                    const target = event.currentTarget;
                    if (!target.naturalWidth || !target.naturalHeight) return;
                    setImageDimensions({ width: target.naturalWidth, height: target.naturalHeight });
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-custom-text-300">
                  Loading image...
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-custom-border-200 bg-custom-background-90">
            {isUnsupportedDocument ? (
              <div
                className={`flex ${previewHeightClass} items-center justify-center rounded-lg bg-custom-background-100 text-xs text-custom-text-300`}
              >
                Only PDF, DOCX, XLSX, CSV, and text files are supported.
              </div>
            ) : isBinaryDocument ? (
              <div className={`${previewHeightClass} rounded-lg bg-custom-background-100`}>
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
                  <div className="h-full overflow-hidden rounded-lg bg-white">
                    <iframe
                      title={`${item.title}-preview`}
                      className="h-full w-full"
                      sandbox=""
                      srcDoc={`<!doctype html><html><head>${DOCUMENT_PREVIEW_STYLE}</head><body><div class="document-preview">${sanitizedDocumentPreviewHtml}</div></body></html>`}
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
              <div
                className={`${previewHeightClass} overflow-auto rounded-lg bg-custom-background-100 p-4 text-xs text-custom-text-100`}
              >
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
              <iframe
                src={effectiveDocumentSrc}
                title={item.title}
                className={`${previewHeightClass} w-full rounded-lg bg-white`}
              />
            ) : (
              <div
                className={`flex ${previewHeightClass} flex-col items-center justify-center gap-3 rounded-lg text-custom-text-300`}
              >
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
        <div className="mt-4">
          <h1 className="text-base font-semibold text-custom-text-100 sm:text-lg">{item.title}</h1>
          <p className="mt-1 text-[11px] text-custom-text-300 sm:text-xs">
            Uploaded by {createdByLabel} - {createdAt}
          </p>
          {description ? <p className="mt-2 text-sm text-custom-text-200">{description}</p> : null}
          {(() => {
            const tags = Array.isArray(item?.meta?.tags)
              ? item.meta.tags.filter((tag: unknown): tag is string => typeof tag === "string" && tag.trim().length > 0)
              : [];
            if (tags.length === 0) return null;
            return (
              <div className="mt-3 rounded-lg border border-custom-border-200 bg-custom-background-90 px-3 py-2">
                <div className="text-[11px] font-semibold text-custom-text-300">Tags</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border border-custom-border-200 bg-custom-background-100 px-2.5 py-1 text-[11px] text-custom-text-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <hr className="border-t border-custom-border-200" />
      </div>

      {item.mediaType === "image" ? (
        <ImageFullScreenModal
          aspectRatio={resolvedAspectRatio}
          downloadSrc={imageDownloadSrc}
          isFullScreenEnabled={isImageZoomOpen}
          isTouchDevice={isTouchDevice}
          src={effectiveImageSrc}
          toggleFullScreenMode={setIsImageZoomOpen}
          width={`${resolvedImageWidth}px`}
        />
      ) : null}
    </>
  );
};
