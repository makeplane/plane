"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@plane/constants";
import { resolveAttachmentDownloadUrl } from "@/components/issues/issue-detail-widgets/media-library-utils";
import { addInlineDisposition, buildDownloadUrl, getVideoFormatFromSrc } from "./media-detail-utils";

type TUseResolvedMediaSourcesArgs = {
  item: any;
  meta: Record<string, unknown>;
  documentFormat: string;
  normalizedAction: string;
};

export const useResolvedMediaSources = ({
  item,
  meta,
  documentFormat,
  normalizedAction,
}: TUseResolvedMediaSourcesArgs) => {
  const videoSrc = item?.videoSrc ?? item?.fileSrc ?? "";
  const rawImageSrc = item?.mediaType === "image" ? item.thumbnail : "";
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
  const effectiveDocumentSrc = isDocumentAssetApiUrl ? resolvedDocumentSrc : resolvedDocumentSrc || item?.fileSrc || "";

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

  const useCredentials = useMemo(() => shouldUseCredentials(effectiveVideoSrc), [effectiveVideoSrc, shouldUseCredentials]);
  const crossOrigin = useCredentials ? "use-credentials" : "anonymous";
  const useDocumentCredentials = useMemo(
    () => shouldUseCredentials(effectiveDocumentSrc),
    [effectiveDocumentSrc, shouldUseCredentials]
  );
  const videoDownloadSrc = videoSrc ? buildDownloadUrl(videoSrc) : "";

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

  return {
    videoSrc,
    rawImageSrc,
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
  };
};

type TUseDocumentPreviewArgs = {
  item: any;
  documentFormat: string;
  effectiveDocumentSrc: string;
  isTextDocument: boolean;
  isBinaryDocument: boolean;
  isUnsupportedDocument: boolean;
  isDocx: boolean;
  isXlsx: boolean;
  isPptx: boolean;
  useDocumentCredentials: boolean;
};

export const useDocumentPreview = ({
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
}: TUseDocumentPreviewArgs) => {
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [textPreviewError, setTextPreviewError] = useState<string | null>(null);
  const [isTextPreviewLoading, setIsTextPreviewLoading] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [documentPreviewHtml, setDocumentPreviewHtml] = useState<string | null>(null);
  const [documentPreviewError, setDocumentPreviewError] = useState<string | null>(null);
  const [isDocumentPreviewLoading, setIsDocumentPreviewLoading] = useState(false);

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

  return {
    textPreview,
    textPreviewError,
    isTextPreviewLoading,
    documentPreviewUrl,
    documentPreviewHtml,
    documentPreviewError,
    isDocumentPreviewLoading,
  };
};
