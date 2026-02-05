"use client";

import type { RefObject } from "react";
import { Download, FileText } from "lucide-react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { PlayerOverlay, PlayerSettingsPanel } from "./player-ui";
import type { TQualityOption } from "./player-ui";
import { DOCUMENT_PREVIEW_STYLE } from "./media-detail-utils";

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
              Only PDF and XLSX files are supported.
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
            <div className={`${previewHeightClass} overflow-auto rounded-lg bg-custom-background-100 p-4 text-xs text-custom-text-100`}>
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
            <iframe src={effectiveDocumentSrc} title={item.title} className={`${previewHeightClass} w-full rounded-lg bg-white`} />
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
    </>
  );
};
