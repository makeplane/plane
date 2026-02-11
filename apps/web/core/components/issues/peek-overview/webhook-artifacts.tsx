"use client";

import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Copy, ExternalLink } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { copyUrlToClipboard } from "@plane/utils";

import { useWebhookArtifactsData } from "./webhook-utils/use-webhook-artifacts-data";
import { useWebhookDocumentPreview } from "./webhook-utils/use-webhook-document-preview";
import { useWebhookVideoPlayer } from "./webhook-utils/use-webhook-video-player";
import { WebhookArtifactModal } from "./webhook-utils/webhook-artifact-modal";
import type { PeekOverviewWebhookArtifactsProps, TWebhookArtifact } from "./webhook-utils/webhook-artifacts-types";

export const PeekOverviewWebhookArtifacts: FC<PeekOverviewWebhookArtifactsProps> = observer((props) => {
  const { workspaceSlug, projectId, issueId, onVideoModalOpenChange } = props;
  const { artifacts } = useWebhookArtifactsData({ workspaceSlug, projectId, issueId });

  const [activeArtifact, setActiveArtifact] = useState<TWebhookArtifact | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const {
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
  } = useWebhookDocumentPreview(activeArtifact);

  useWebhookVideoPlayer(activeArtifact, videoElement);

  const handleCopyPath = useCallback((value: string) => {
    copyUrlToClipboard(value)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Path copied",
          message: "Artifact path copied to clipboard.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Copy failed",
          message: "Unable to copy artifact path.",
        });
      });
  }, []);

  const handleOpenArtifactModal = useCallback(
    (artifact: TWebhookArtifact) => {
      onVideoModalOpenChange?.(true);
      setActiveArtifact(artifact);
    },
    [onVideoModalOpenChange]
  );

  const handleCloseArtifactModal = useCallback(() => {
    onVideoModalOpenChange?.(false);
    setActiveArtifact(null);
  }, [onVideoModalOpenChange]);

  useEffect(
    () => () => {
      onVideoModalOpenChange?.(false);
    },
    [onVideoModalOpenChange]
  );

  if (artifacts.length === 0) return <></>;

  return (
    <div className="space-y-2">
      {artifacts.map((artifact) => (
        <div
          key={artifact.id}
          className="group rounded-lg border border-custom-border-200 bg-custom-background-90 px-3 py-2.5 transition-colors hover:border-custom-border-300"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-custom-text-100">{artifact.title}</p>
              <p className="text-[11px] uppercase tracking-wide text-custom-text-300">
                {artifact.mediaType} {artifact.format ? `• ${artifact.format}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleOpenArtifactModal(artifact)}
                className="rounded p-1.5 text-custom-text-300 transition-colors hover:bg-custom-background-100 hover:text-custom-text-100"
                title="Open preview"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleCopyPath(artifact.path)}
                className="rounded p-1.5 text-custom-text-300 transition-colors hover:bg-custom-background-100 hover:text-custom-text-100"
                title="Copy path"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="break-all rounded-md bg-custom-background-100 px-2 py-1.5 text-xs leading-5 text-custom-text-300">
            {artifact.path}
          </p>
        </div>
      ))}

      <WebhookArtifactModal
        activeArtifact={activeArtifact}
        onClose={handleCloseArtifactModal}
        setVideoElement={setVideoElement}
        effectiveDocumentSrc={effectiveDocumentSrc}
        isTextDocument={isTextDocument}
        isBinaryDocument={isBinaryDocument}
        isUnsupportedDocument={isUnsupportedDocument}
        isDocumentPreviewLoading={isDocumentPreviewLoading}
        documentPreviewError={documentPreviewError}
        documentPreviewHtml={documentPreviewHtml}
        sanitizedDocumentPreviewHtml={sanitizedDocumentPreviewHtml}
        documentPreviewUrl={documentPreviewUrl}
        isTextPreviewLoading={isTextPreviewLoading}
        textPreviewError={textPreviewError}
        textPreview={textPreview}
      />
    </div>
  );
});
