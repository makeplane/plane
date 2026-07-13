/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Loader2, X } from "lucide-react";
// plane imports
import { PDFViewer } from "@plane/extend-ui";
import { useTranslation } from "@plane/i18n";
import type { TExpenseDocument } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// services
import { financeService } from "@/services/finance.service";

type ViewerKind = "pdf" | "image" | "none";

const viewerKind = (document: TExpenseDocument): ViewerKind => {
  const type = (document.type ?? "").toLowerCase();
  const extension = document.name.slice(document.name.lastIndexOf(".") + 1).toLowerCase();
  if (type === "application/pdf" || extension === "pdf") return "pdf";
  if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp"].includes(extension))
    return "image";
  return "none";
};

type Props = {
  workspaceSlug: string;
  expenseId: string | null;
  /** Every document on the expense, so the viewer can page through them */
  documents: TExpenseDocument[];
  /** Which one to open on; null closes the viewer */
  initialIndex: number | null;
  onClose: () => void;
};

export function DocumentViewer(props: Props) {
  const { workspaceSlug, expenseId, documents, initialIndex, onClose } = props;
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const isOpen = initialIndex !== null && expenseId !== null;
  const current = documents[index];

  useEffect(() => {
    if (initialIndex !== null) setIndex(initialIndex);
  }, [initialIndex]);

  // Resolve a fresh presigned URL for whichever document is on screen. Payments
  // resolves its own — borrowing the library's download route would break in a
  // workspace that runs payments without the file library.
  useEffect(() => {
    if (!isOpen || !current || !expenseId) return;
    let cancelled = false;
    setIsLoading(true);
    setHasFailed(false);
    setUrl(null);

    const resolve = async () => {
      try {
        const resolved = await financeService.getDocumentViewUrl(workspaceSlug, expenseId, current.asset_id);
        if (!cancelled) setUrl(resolved);
      } catch {
        if (!cancelled) setHasFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void resolve();

    return () => {
      cancelled = true;
    };
  }, [isOpen, expenseId, current?.asset_id, workspaceSlug, current]);

  const go = useCallback(
    (step: number) => setIndex((value) => (value + step + documents.length) % documents.length),
    [documents.length]
  );

  // Arrow keys page through the documents, as in any image viewer
  useEffect(() => {
    if (!isOpen || documents.length < 2) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, documents.length, go]);

  const kind = current ? viewerKind(current) : "none";

  const body = () => {
    if (hasFailed) return <p className="text-13 text-tertiary">{t("payments.toasts.error")}</p>;
    if (isLoading || !url) return <Loader2 className="size-5 animate-spin text-tertiary" />;
    switch (kind) {
      case "pdf":
        return <PDFViewer src={url} fileName={current.name} className="h-full" showUpload={false} />;
      case "image":
        return (
          <div className="flex h-full items-center justify-center overflow-auto p-4">
            <img src={url} alt={current.name} className="max-h-full max-w-full object-contain" />
          </div>
        );
      default:
        // Anything the browser can't render inline (a .zip receipt, say) still
        // has to be reachable — offer the download instead of a dead panel.
        return (
          <div className="flex flex-col items-center gap-3">
            <p className="text-13 text-tertiary">{current?.name}</p>
            <a
              href={url}
              download={current?.name}
              className="flex items-center gap-1.5 rounded-sm border border-subtle px-3 py-1.5 text-12 hover:bg-layer-1-hover"
            >
              <Download className="size-3.5" />
              {t("payments.actions.download")}
            </a>
          </div>
        );
    }
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.VIIXL}
      className="flex flex-col overflow-hidden max-sm:h-[calc(100dvh-1rem)] max-sm:w-[calc(100vw-1rem)] max-sm:max-w-none max-sm:rounded-lg sm:h-[85vh]"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-subtle px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-14 font-medium">{current?.name}</span>
          {documents.length > 1 && (
            <span className="shrink-0 text-11 text-tertiary">
              {index + 1} / {documents.length}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {documents.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded-sm p-1.5 text-tertiary hover:bg-layer-1-hover hover:text-primary"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="rounded-sm p-1.5 text-tertiary hover:bg-layer-1-hover hover:text-primary"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
          {url && (
            <a
              href={url}
              download={current?.name}
              title={t("payments.actions.download")}
              className="rounded-sm p-1.5 text-tertiary hover:bg-layer-1-hover hover:text-primary"
            >
              <Download className="size-4" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1.5 text-tertiary hover:bg-layer-1-hover hover:text-primary"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center bg-layer-2">{body()}</div>
    </ModalCore>
  );
}
