/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Download, FileText, Loader2, X } from "lucide-react";
import { Link } from "react-router";
import useSWR from "swr";
// plane imports
import { CsvViewer, DocxViewerPreview, PDFViewer, XlsxViewerPreview } from "@plane/extend-ui";
import { useTranslation } from "@plane/i18n";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";
// services
import { contractService } from "@/services/contract.service";
// local imports
import { ProcessingBadge } from "./contracts/processing-badge";

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
  const [showContractInfo, setShowContractInfo] = useState(false);
  // Mobile is single-focus: one tab at a time (document or contract info)
  const [mobileView, setMobileView] = useState<"document" | "info">("document");
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" ? document.documentElement.dataset.theme === "dark" : false
  );

  const kind = file ? viewerKind(file) : "none";

  // Contract PDFs also expose their AI-extracted data right in the viewer
  const { data: contractMatches } = useSWR(
    file && kind === "pdf" ? `CONTRACT_BY_ASSET_${file.assetId}` : null,
    () => contractService.getContracts(workspaceSlug, { asset_id: file!.assetId }),
    { revalidateOnFocus: false }
  );
  const contract = contractMatches?.[0];

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
      // Near-full-screen on mobile, keeping the rounded card look
      className="flex flex-col overflow-hidden max-sm:h-[calc(100dvh-1rem)] max-sm:w-[calc(100vw-1rem)] max-sm:max-w-none max-sm:rounded-lg sm:h-[85vh]"
    >
      {file && (
        <>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-subtle px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-14 font-medium">{file.name}</span>
              {contract && <ProcessingBadge contract={contract} />}
            </div>
            <div className="flex items-center gap-1">
              {contract && (
                <button
                  type="button"
                  onClick={() => setShowContractInfo((value) => !value)}
                  className={cn(
                    // Mobile switches views with the tabs instead of this toggle
                    "hidden items-center gap-1 rounded-sm px-2 py-1.5 text-12 hover:bg-layer-1-hover sm:flex",
                    showContractInfo ? "text-accent-primary" : ""
                  )}
                  title={t("file_library.contracts.preview_info")}
                >
                  <FileText className="size-4" />
                  <span className="hidden sm:inline">{t("file_library.contracts.preview_info")}</span>
                </button>
              )}
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
          {/* Mobile tabs: the document and the contract info each get full focus */}
          {contract && (
            <div className="flex shrink-0 items-center gap-1 border-b border-subtle px-3 pt-1.5 sm:hidden">
              {(["document", "info"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMobileView(key)}
                  className={cn(
                    "rounded-t-sm border-b-2 px-3 py-1.5 text-12 font-medium",
                    mobileView === key
                      ? "border-accent-strong text-accent-primary"
                      : "border-transparent text-tertiary"
                  )}
                >
                  {t(key === "document" ? "file_library.contracts.tabs.document" : "file_library.contracts.tabs.info")}
                </button>
              ))}
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <div className={cn("min-h-0 flex-1", contract && mobileView === "info" ? "max-sm:hidden" : "")}>
              {renderBody()}
            </div>
            {/* AI-extracted contract data: tab on mobile, side panel on desktop */}
            {contract && (
              <div
                className={cn(
                  "min-h-0 overflow-y-auto max-sm:flex-1 sm:w-80 sm:shrink-0 sm:border-l sm:border-subtle",
                  mobileView !== "info" && "max-sm:hidden",
                  !showContractInfo && "sm:hidden"
                )}
              >
                <div className="space-y-4 p-4">
                  {contract.titulo && (
                    <div>
                      <p className="text-10 font-semibold uppercase tracking-wide text-tertiary">
                        {t("file_library.contracts.fields.titulo")}
                      </p>
                      <p className="mt-1 text-13 font-medium leading-snug">{contract.titulo}</p>
                    </div>
                  )}
                  {contract.resumen_general && (
                    <div>
                      <p className="text-10 font-semibold uppercase tracking-wide text-tertiary">
                        {t("file_library.contracts.fields.resumen_general")}
                      </p>
                      <p className="mt-1 rounded-md bg-layer-1 p-2.5 text-12 leading-relaxed text-secondary">
                        {contract.resumen_general}
                      </p>
                    </div>
                  )}
                  {contract.artistas && (
                    <div>
                      <p className="text-10 font-semibold uppercase tracking-wide text-tertiary">
                        {t("file_library.contracts.fields.artistas")}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {contract.artistas.split(",").map((artist) => (
                          <span key={artist} className="rounded-full bg-layer-1 px-2 py-0.5 text-11 text-secondary">
                            {artist.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {contract.involucrados && (
                    <div>
                      <p className="text-10 font-semibold uppercase tracking-wide text-tertiary">
                        {t("file_library.contracts.fields.involucrados")}
                      </p>
                      <p className="mt-1 text-12 leading-relaxed text-secondary">{contract.involucrados}</p>
                    </div>
                  )}
                  {(contract.fecha_inicio || contract.fecha_fin || contract.fecha_fin_efectiva) && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md border border-subtle p-2.5">
                      {contract.fecha_inicio && (
                        <div>
                          <p className="text-10 font-semibold uppercase tracking-wide text-tertiary">
                            {t("file_library.contracts.fields.fecha_inicio")}
                          </p>
                          <p className="mt-0.5 text-12 tabular-nums">{contract.fecha_inicio}</p>
                        </div>
                      )}
                      {contract.fecha_fin && (
                        <div>
                          <p className="text-10 font-semibold uppercase tracking-wide text-tertiary">
                            {t("file_library.contracts.fields.fecha_fin")}
                          </p>
                          <p className="mt-0.5 text-12 tabular-nums">{contract.fecha_fin}</p>
                        </div>
                      )}
                      {contract.fecha_fin_efectiva && (
                        <div>
                          <p className="text-10 font-semibold uppercase tracking-wide text-tertiary">
                            {t("file_library.contracts.fields.fecha_fin_efectiva")}
                          </p>
                          <p className="mt-0.5 text-12 font-medium tabular-nums text-accent-primary">
                            {contract.fecha_fin_efectiva}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <Link
                    to={`/${workspaceSlug}/file-library/contracts?peek=${contract.id}`}
                    onClick={onClose}
                    className="inline-block w-full rounded-md border border-subtle px-2.5 py-1.5 text-center text-12 font-medium hover:bg-layer-1-hover"
                  >
                    {t("file_library.contracts.open_in_contracts")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </ModalCore>
  );
});
