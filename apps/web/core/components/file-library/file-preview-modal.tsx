/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Download, Loader2, X } from "lucide-react";
// plane imports
import { CsvViewer, DocxViewerPreview, PDFViewer, XlsxViewerPreview } from "@plane/extend-ui";
import { useTranslation } from "@plane/i18n";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
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

  const renderBody = () => {
    if (!file) return null;
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
        return <CsvViewer data={csvData ?? ""} showActions={false} className="h-full" />;
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

  return (
    <ModalCore
      isOpen={file !== null}
      handleClose={onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.VIIXL}
      // Full screen on mobile to maximize the viewing surface
      className="flex flex-col overflow-hidden max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:rounded-none sm:h-[85vh]"
    >
      {file && (
        <>
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
        </>
      )}
    </ModalCore>
  );
});
