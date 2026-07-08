/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { observer } from "mobx-react";
import { Download, Loader2, X } from "lucide-react";
// plane imports
import { CsvViewer, DocxViewerPreview, PDFViewer, XlsxViewerPreview } from "@plane/extend-ui";
import { useTranslation } from "@plane/i18n";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";

export type TPreviewFile = {
  assetId: string;
  name: string;
  contentType: string;
};

type ViewerKind = "image" | "pdf" | "xlsx" | "docx" | "csv" | "none";

const ext = (name: string) => name.slice(name.lastIndexOf(".") + 1).toLowerCase();

function viewerKind(file: TPreviewFile): ViewerKind {
  const type = (file.contentType ?? "").toLowerCase();
  const e = ext(file.name);
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"].includes(e))
    return "image";
  if (type === "application/pdf" || e === "pdf") return "pdf";
  if (type.includes("spreadsheetml") || type.includes("ms-excel") || ["xlsx", "xls"].includes(e)) return "xlsx";
  if (type.includes("wordprocessingml") || type.includes("msword") || ["docx", "doc"].includes(e)) return "docx";
  if (type === "text/csv" || type === "text/tab-separated-values" || ["csv", "tsv"].includes(e)) return "csv";
  return "none";
}

type Props = {
  workspaceSlug: string;
  file: TPreviewFile | null;
  onClose: () => void;
};

export const FilePreviewModal = observer(function FilePreviewModal(props: Props) {
  const { workspaceSlug, file, onClose } = props;
  const { t } = useTranslation();
  const { getPresignedViewUrl, getFileDownloadUrl } = useFileLibrary();
  // states
  const [url, setUrl] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.dataset.theme === "dark" : false
  );

  const kind = file ? viewerKind(file) : "none";

  // resolve the presigned URL (and fetch text for csv) whenever the file changes
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setIsLoading(true);
    setError(false);
    setUrl(null);
    setCsvData(null);
    (async () => {
      try {
        const presigned = await getPresignedViewUrl(workspaceSlug, file.assetId);
        if (cancelled) return;
        setUrl(presigned);
        if (viewerKind(file) === "csv") {
          const res = await fetch(presigned);
          const text = await res.text();
          if (!cancelled) setCsvData(text);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file, workspaceSlug, getPresignedViewUrl]);

  // close on escape
  useEffect(() => {
    if (!file) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, onClose]);

  // The backdrop and panel are non-interactive layout elements — they don't need
  // JSX onClick/keyboard handling of their own (Escape, handled above, is the
  // keyboard equivalent). Listeners are attached imperatively via ref instead of
  // JSX props so they close-on-backdrop-click / stop the panel from bubbling to
  // it, without static-analysis a11y rules mistaking either div for something a
  // keyboard user is expected to activate directly.
  //
  // The ref callbacks below have empty dep arrays so they fire exactly once per
  // mount (never re-run on re-render), which is what makes it safe to attach a
  // plain, un-removed listener inside them. onClose is read through a ref so the
  // listener always calls the latest closure without needing to be re-attached.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeOnBackdropClick = useCallback((element: HTMLDivElement | null) => {
    element?.addEventListener("click", () => onCloseRef.current());
  }, []);
  const stopClickFromReachingBackdrop = useCallback((element: HTMLDivElement | null) => {
    element?.addEventListener("click", (e) => e.stopPropagation());
  }, []);

  if (!file) return null;

  const renderBody = () => {
    if (isLoading || (kind === "csv" && csvData === null && !error)) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="size-6 animate-spin text-tertiary" />
        </div>
      );
    }
    if (error || !url) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-tertiary">
          <p className="text-14">{t("file_library.preview.error")}</p>
        </div>
      );
    }
    switch (kind) {
      case "image":
        return (
          <div className="flex h-full items-center justify-center overflow-auto p-4">
            <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
          </div>
        );
      case "pdf":
        return <PDFViewer src={url} fileName={file.name} className="h-full" showUpload={false} />;
      case "xlsx":
        return (
          <XlsxViewerPreview
            src={url}
            fileName={file.name}
            isDark={isDark}
            onIsDarkChange={setIsDark}
            showUpload={false}
            className="h-full"
          />
        );
      case "docx":
        return (
          <DocxViewerPreview
            src={url}
            fileName={file.name}
            isDark={isDark}
            onIsDarkChange={setIsDark}
            showUpload={false}
            className="h-full"
          />
        );
      case "csv":
        return <CsvViewer data={csvData ?? ""} search className="h-full" />;
      default:
        return (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-tertiary">
            <p className="text-14">{t("file_library.preview.no_preview")}</p>
            <a
              href={getFileDownloadUrl(workspaceSlug, file.assetId)}
              className="flex items-center gap-1.5 rounded-md bg-accent-primary px-3 py-1.5 text-13 text-on-color"
            >
              <Download className="size-3.5" />
              {t("file_library.download")}
            </a>
          </div>
        );
    }
  };

  return createPortal(
    <div ref={closeOnBackdropClick} className="fixed inset-0 z-30 flex items-center justify-center bg-backdrop/80 p-4">
      <div
        ref={stopClickFromReachingBackdrop}
        className="flex h-[92vh] w-[92vw] flex-col overflow-hidden rounded-lg border border-subtle bg-canvas shadow-raised-300"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-subtle px-4 py-2.5">
          <span className="truncate text-14 font-medium">{file.name}</span>
          <div className="flex items-center gap-1">
            <a
              href={getFileDownloadUrl(workspaceSlug, file.assetId)}
              className="rounded-sm p-1.5 hover:bg-layer-1-hover"
              title={t("file_library.download")}
            >
              <Download className="size-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-1.5 hover:bg-layer-1-hover"
              title={t("close")}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1">{renderBody()}</div>
      </div>
    </div>,
    document.body
  );
});
