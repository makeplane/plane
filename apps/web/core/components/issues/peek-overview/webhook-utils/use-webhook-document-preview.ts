import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { API_BASE_URL } from "@plane/constants";

import { resolveAttachmentDownloadUrl } from "@/components/issues/issue-detail-widgets/media-library-utils";
import {
  addInlineDisposition,
} from "../../../../../app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/media-library/[mediaId]/media-detail-utils";
import { useDocumentPreview } from "../../../../../app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/media-library/hooks/media-detail-hooks";

import type { TWebhookArtifact } from "./webhook-artifacts-types";
import { inferFormatFromPath, shouldUseCredentialsForSource } from "./webhook-artifacts-utils";
import { SPREADSHEET_FORMATS, SUPPORTED_DOCUMENT_FORMATS, TEXT_DOCUMENT_FORMATS } from "./webhook-artifacts-constants";

export const useWebhookDocumentPreview = (activeArtifact: TWebhookArtifact | null) => {
  const [resolvedDocumentSrc, setResolvedDocumentSrc] = useState("");

  const rawActiveDocumentSrc = activeArtifact?.mediaType === "document" ? activeArtifact.openUrl : "";

  const activeDocumentFormat = useMemo(() => {
    if (activeArtifact?.mediaType !== "document") return "";
    return (activeArtifact.format || inferFormatFromPath(activeArtifact.path) || inferFormatFromPath(activeArtifact.openUrl) || "")
      .toLowerCase()
      .trim();
  }, [activeArtifact]);

  const effectiveDocumentSrc = useMemo(
    () => (activeArtifact?.mediaType === "document" ? resolvedDocumentSrc || rawActiveDocumentSrc : ""),
    [activeArtifact?.mediaType, rawActiveDocumentSrc, resolvedDocumentSrc]
  );

  const isTextDocument = Boolean(activeArtifact?.mediaType === "document" && TEXT_DOCUMENT_FORMATS.has(activeDocumentFormat));
  const isDocx = Boolean(activeArtifact?.mediaType === "document" && activeDocumentFormat === "docx");
  const isSpreadsheet = Boolean(activeArtifact?.mediaType === "document" && SPREADSHEET_FORMATS.has(activeDocumentFormat));
  const isPptx = Boolean(activeArtifact?.mediaType === "document" && activeDocumentFormat === "pptx");
  const isBinaryDocument = Boolean(activeArtifact?.mediaType === "document" && !isTextDocument);
  const isUnsupportedDocument = Boolean(
    activeArtifact?.mediaType === "document" && !SUPPORTED_DOCUMENT_FORMATS.has(activeDocumentFormat)
  );

  useEffect(() => {
    let isMounted = true;

    if (activeArtifact?.mediaType !== "document" || !rawActiveDocumentSrc) {
      setResolvedDocumentSrc("");
      return () => {
        isMounted = false;
      };
    }

    const isAssetApiUrl =
      Boolean(API_BASE_URL) &&
      typeof rawActiveDocumentSrc === "string" &&
      rawActiveDocumentSrc.startsWith(API_BASE_URL) &&
      rawActiveDocumentSrc.includes("/api/assets/v2/");

    if (!isAssetApiUrl) {
      setResolvedDocumentSrc(rawActiveDocumentSrc);
      return () => {
        isMounted = false;
      };
    }

    setResolvedDocumentSrc("");
    const resolveUrl = async () => {
      try {
        const resolved = await resolveAttachmentDownloadUrl(addInlineDisposition(rawActiveDocumentSrc));
        if (isMounted) setResolvedDocumentSrc(resolved || rawActiveDocumentSrc);
      } catch {
        if (isMounted) setResolvedDocumentSrc(rawActiveDocumentSrc);
      }
    };

    void resolveUrl();

    return () => {
      isMounted = false;
    };
  }, [activeArtifact?.mediaType, rawActiveDocumentSrc]);

  const useDocumentCredentials = useMemo(
    () => shouldUseCredentialsForSource(effectiveDocumentSrc),
    [effectiveDocumentSrc]
  );

  const previewDocumentItem = useMemo(
    () => (activeArtifact?.mediaType === "document" ? { mediaType: "document", title: activeArtifact.title } : null),
    [activeArtifact]
  );

  const {
    textPreview,
    textPreviewError,
    isTextPreviewLoading,
    documentPreviewUrl,
    documentPreviewHtml,
    documentPreviewError,
    isDocumentPreviewLoading,
  } = useDocumentPreview({
    item: previewDocumentItem,
    documentFormat: activeDocumentFormat,
    effectiveDocumentSrc,
    isTextDocument,
    isBinaryDocument,
    isUnsupportedDocument,
    isDocx,
    isSpreadsheet,
    isPptx,
    useDocumentCredentials,
  });

  const sanitizedDocumentPreviewHtml = useMemo(
    () => (documentPreviewHtml ? DOMPurify.sanitize(documentPreviewHtml, { USE_PROFILES: { html: true } }) : ""),
    [documentPreviewHtml]
  );

  return {
    activeDocumentFormat,
    effectiveDocumentSrc,
    isTextDocument,
    isBinaryDocument,
    isUnsupportedDocument,
    textPreview,
    textPreviewError,
    isTextPreviewLoading,
    documentPreviewUrl,
    documentPreviewHtml,
    sanitizedDocumentPreviewHtml,
    documentPreviewError,
    isDocumentPreviewLoading,
  };
};
