import { Download, FileText, X } from "lucide-react";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

import { LogoSpinner } from "@/components/common/logo-spinner";
import { DOCUMENT_PREVIEW_STYLE } from "../../../../../app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/media-library/[mediaId]/media-detail-utils";

import type { TWebhookArtifact } from "./webhook-artifacts-types";
import { WEBHOOK_DOCUMENT_PREVIEW_HEIGHT_CLASS } from "./webhook-artifacts-constants";

type TWebhookArtifactModalProps = {
  activeArtifact: TWebhookArtifact | null;
  onClose: () => void;
  setVideoElement: (element: HTMLVideoElement | null) => void;
  effectiveDocumentSrc: string;
  isTextDocument: boolean;
  isBinaryDocument: boolean;
  isUnsupportedDocument: boolean;
  isDocumentPreviewLoading: boolean;
  documentPreviewError: string | null;
  documentPreviewHtml: string | null;
  sanitizedDocumentPreviewHtml: string;
  documentPreviewUrl: string | null;
  isTextPreviewLoading: boolean;
  textPreviewError: string | null;
  textPreview: string | null;
};

export const WebhookArtifactModal = ({
  activeArtifact,
  onClose,
  setVideoElement,
  effectiveDocumentSrc,
  isTextDocument,
  isBinaryDocument,
  isUnsupportedDocument,
  isDocumentPreviewLoading,
  documentPreviewError,
  documentPreviewHtml,
  sanitizedDocumentPreviewHtml,
  documentPreviewUrl,
  isTextPreviewLoading,
  textPreviewError,
  textPreview,
}: TWebhookArtifactModalProps) => (
  <ModalCore
    isOpen={Boolean(activeArtifact)}
    handleClose={onClose}
    position={EModalPosition.CENTER}
    width={EModalWidth.XXXXL}
    className="overflow-hidden p-0"
  >
    <div
      data-prevent-outside-click
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-custom-border-200 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-custom-text-100">{activeArtifact?.title ?? "Artifact"}</p>
          <p className="text-[11px] uppercase tracking-wide text-custom-text-300">
            {activeArtifact?.mediaType ?? "preview"} {activeArtifact?.format ? `• ${activeArtifact.format}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1.5 text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 p-4">
        {activeArtifact?.mediaType === "video" && (
          <div className="aspect-video w-full overflow-hidden rounded-md bg-black">
            <div data-vjs-player className="h-full w-full">
              <video ref={setVideoElement} className="video-js vjs-default-skin h-full w-full" playsInline preload="auto" />
            </div>
          </div>
        )}

        {activeArtifact?.mediaType === "image" && (
          <div className="flex min-h-[420px] max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-md bg-black/80 p-2">
            <img
              src={activeArtifact.openUrl}
              alt={activeArtifact.title}
              className="max-h-[68vh] w-auto max-w-full object-contain"
              loading="lazy"
            />
          </div>
        )}

        {activeArtifact?.mediaType === "document" && (
          <div className="rounded-lg border border-custom-border-200 bg-custom-background-90">
            {isUnsupportedDocument ? (
              <div
                className={`flex ${WEBHOOK_DOCUMENT_PREVIEW_HEIGHT_CLASS} items-center justify-center rounded-lg bg-custom-background-100 text-xs text-custom-text-300`}
              >
                Only PDF, DOCX, XLSX, CSV, and text files are supported.
              </div>
            ) : isBinaryDocument ? (
              <div className={`${WEBHOOK_DOCUMENT_PREVIEW_HEIGHT_CLASS} rounded-lg bg-custom-background-100`}>
                {isDocumentPreviewLoading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-custom-text-300">
                    <LogoSpinner />
                    <span>Loading preview...</span>
                  </div>
                ) : documentPreviewError ? (
                  <div className="flex h-full items-center justify-center text-xs text-custom-text-300">{documentPreviewError}</div>
                ) : documentPreviewHtml ? (
                  <div className="h-full overflow-hidden rounded-lg bg-white">
                    <iframe
                      title={`${activeArtifact.title}-preview`}
                      className="h-full w-full"
                      sandbox=""
                      srcDoc={`<!doctype html><html><head>${DOCUMENT_PREVIEW_STYLE}</head><body><div class=\"document-preview\">${sanitizedDocumentPreviewHtml}</div></body></html>`}
                    />
                  </div>
                ) : documentPreviewUrl ? (
                  <iframe src={documentPreviewUrl} title={activeArtifact.title} className="h-full w-full rounded-lg bg-white" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-custom-text-300">
                    No preview available for this file.
                  </div>
                )}
              </div>
            ) : isTextDocument ? (
              <div
                className={`${WEBHOOK_DOCUMENT_PREVIEW_HEIGHT_CLASS} overflow-auto rounded-lg bg-custom-background-100 p-4 text-xs text-custom-text-100`}
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
                title={activeArtifact.title}
                className={`${WEBHOOK_DOCUMENT_PREVIEW_HEIGHT_CLASS} w-full rounded-lg bg-white`}
              />
            ) : (
              <div
                className={`flex ${WEBHOOK_DOCUMENT_PREVIEW_HEIGHT_CLASS} flex-col items-center justify-center gap-3 rounded-lg text-custom-text-300`}
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

        <div className="flex items-center justify-between gap-2">
          <p className="break-all rounded-md bg-custom-background-90 px-2 py-1.5 text-xs leading-5 text-custom-text-300">
            {activeArtifact?.path}
          </p>
          <a
            href={activeArtifact?.openUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded-md border border-custom-border-200 px-2 py-1.5 text-xs text-custom-text-200 hover:text-custom-text-100"
          >
            Open file
          </a>
        </div>
      </div>
    </div>
  </ModalCore>
);
