"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, FileText, User } from "lucide-react";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { useMediaLibraryItems } from "../(list)/use-media-library-items";
import { HlsVideo } from "../hls-video";
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

const MediaDetailPage = () => {
  const { mediaId, workspaceSlug, projectId } = useParams() as {
    mediaId: string;
    workspaceSlug: string;
    projectId: string;
  };
  const { items: libraryItems, isLoading } = useMediaLibraryItems(workspaceSlug, projectId);
  const [activeTab, setActiveTab] = useState<"details" | "tags">("details");
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
  const normalizedAction = (item?.action ?? "").toLowerCase();
  const documentFormat = item?.format?.toLowerCase() ?? "";
  const isVideoAction = new Set(["play", "play_hls", "play_streaming", "open_mp4"]).has(normalizedAction);
  const isVideoFormat = new Set(["mp4", "m4v", "m3u8", "mov", "webm", "avi", "mkv", "mpeg", "mpg", "stream"]).has(
    documentFormat
  );
  const isVideo = item?.mediaType === "video" || item?.linkedMediaType === "video" || isVideoAction || isVideoFormat;
  const isHls =
    isVideo && (documentFormat === "m3u8" || (documentFormat === "stream" && normalizedAction === "play_streaming"));
  const videoSrc = item?.videoSrc ?? item?.fileSrc ?? "";
  const isPdf = item?.mediaType === "document" && documentFormat === "pdf";
  const isTextDocument =
    item?.mediaType === "document" &&
    new Set(["txt", "csv", "json", "md", "log", "yaml", "yml", "xml"]).has(documentFormat);
  const isDocx = item?.mediaType === "document" && documentFormat === "docx";
  const isXlsx = item?.mediaType === "document" && new Set(["xlsx", "xls"]).has(documentFormat);
  const isPptx = item?.mediaType === "document" && documentFormat === "pptx";
  const isBinaryDocument = item?.mediaType === "document" && !isTextDocument;

  useEffect(() => {
    let isMounted = true;
    const fileSrc = item?.fileSrc;
    if (!item || item.mediaType !== "document" || !fileSrc || !isTextDocument) {
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

    if (!item || !fileSrc || !isBinaryDocument) {
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
  }, [isBinaryDocument, isDocx, isPptx, isXlsx, item?.fileSrc, item?.mediaType]);
  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.scrollIntoView({ behavior: "smooth", block: "center" });
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
  const meta = item.meta ?? {};
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
            <div className="mx-auto h-[505px] w-100 max-w-full overflow-hidden rounded-lg border border-custom-border-200 bg-black">
              {isHls ? (
                <HlsVideo
                  src={videoSrc}
                  poster={item.thumbnail}
                  className="h-full w-full object-contain"
                  videoRef={videoRef}
                />
              ) : (
                <video ref={videoRef} controls poster={item.thumbnail} className="h-full w-full object-contain">
                  <source src={videoSrc} type={getVideoMimeType(documentFormat) || undefined} />
                </video>
              )}
            </div>
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
              {isBinaryDocument ? (
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
              {item.fileSrc ? (
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
              className={`rounded-full px-3 py-1 ${
                activeTab === "details"
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
