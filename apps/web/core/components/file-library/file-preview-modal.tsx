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
      // Full screen on mobile to maximize the viewing surface
      className="flex flex-col overflow-hidden max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:rounded-none sm:h-[85vh]"
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
                    "flex items-center gap-1 rounded-sm px-2 py-1.5 text-12 hover:bg-layer-1-hover",
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
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            <div className="min-h-0 flex-1">{renderBody()}</div>
            {/* AI-extracted contract data, right beside the document */}
            {contract && showContractInfo && (
              <div className="max-h-56 shrink-0 space-y-2 overflow-y-auto border-t border-subtle p-3 text-12 sm:max-h-none sm:w-72 sm:border-t-0 sm:border-l">
                {contract.titulo && (
                  <p>
                    <span className="font-medium text-tertiary">{t("file_library.contracts.fields.titulo")}: </span>
                    {contract.titulo}
                  </p>
                )}
                {contract.resumen_general && <p className="text-secondary">{contract.resumen_general}</p>}
                {contract.artistas && (
                  <p>
                    <span className="font-medium text-tertiary">{t("file_library.contracts.fields.artistas")}: </span>
                    {contract.artistas}
                  </p>
                )}
                {contract.involucrados && (
                  <p>
                    <span className="font-medium text-tertiary">
                      {t("file_library.contracts.fields.involucrados")}:{" "}
                    </span>
                    {contract.involucrados}
                  </p>
                )}
                {(contract.fecha_inicio || contract.fecha_fin) && (
                  <p className="tabular-nums">
                    <span className="font-medium text-tertiary">
                      {t("file_library.contracts.fields.fecha_inicio")} – {t("file_library.contracts.fields.fecha_fin")}
                      :{" "}
                    </span>
                    {contract.fecha_inicio ?? "—"} → {contract.fecha_fin ?? "—"}
                  </p>
                )}
                {contract.fecha_fin_efectiva && (
                  <p className="tabular-nums">
                    <span className="font-medium text-tertiary">
                      {t("file_library.contracts.fields.fecha_fin_efectiva")}:{" "}
                    </span>
                    {contract.fecha_fin_efectiva}
                  </p>
                )}
                <Link
                  to={`/${workspaceSlug}/file-library/contracts?peek=${contract.id}`}
                  onClick={onClose}
                  className="inline-block rounded-md border border-subtle px-2.5 py-1 text-12 font-medium hover:bg-layer-1-hover"
                >
                  {t("file_library.contracts.open_in_contracts")}
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </ModalCore>
  );
});
