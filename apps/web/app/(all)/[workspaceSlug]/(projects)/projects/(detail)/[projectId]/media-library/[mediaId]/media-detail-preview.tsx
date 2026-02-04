"use client";

import type { RefObject } from "react";
import { FileText } from "lucide-react";
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
  crossOrigin: string;
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
}: TMediaDetailPreviewProps) => (
  <>
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
