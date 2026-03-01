/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useParams } from "react-router";
import { LoaderCircle } from "lucide-react";
// plane editor
import type { EditorRefApi } from "@plane/editor";
// plane ui
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// services
import { liveService } from "@/services/live.service";

// hooks
import { useParseEditorContent } from "@/hooks/use-parse-editor-content";

type Props = {
  editorRef: EditorRefApi | null;
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  pageId: string;
  teamspaceId?: string;
};

type TExportFormats = "pdf" | "markdown";
type TPageFormats = "A4" | "A3" | "A2" | "LETTER" | "LEGAL" | "TABLOID";
type TContentVariety = "everything" | "no-assets";

type TFormValues = {
  export_format: TExportFormats;
  page_format: TPageFormats;
  content_variety: TContentVariety;
};

type TExportState = "idle" | "exporting" | "cancelling" | "complete" | "error";

const EXPORT_FORMATS: {
  key: TExportFormats;
  label: string;
}[] = [
  {
    key: "pdf",
    label: "PDF",
  },
  {
    key: "markdown",
    label: "Markdown",
  },
];

const PAGE_FORMATS: {
  key: TPageFormats;
  label: string;
}[] = [
  {
    key: "A4",
    label: "A4",
  },
  {
    key: "A3",
    label: "A3",
  },
  {
    key: "A2",
    label: "A2",
  },
  {
    key: "LETTER",
    label: "Letter",
  },
  {
    key: "LEGAL",
    label: "Legal",
  },
  {
    key: "TABLOID",
    label: "Tabloid",
  },
];

const CONTENT_VARIETY: {
  key: TContentVariety;
  label: string;
}[] = [
  {
    key: "everything",
    label: "Everything",
  },
  {
    key: "no-assets",
    label: "No images",
  },
];

const defaultValues: TFormValues = {
  export_format: "pdf",
  page_format: "A4",
  content_variety: "everything",
};

export function ExportPageModal(props: Props) {
  const { editorRef, isOpen, onClose, pageTitle, pageId, teamspaceId } = props;
  // states
  const [exportState, setExportState] = useState<TExportState>("idle");

  const [errorMessage, setErrorMessage] = useState<string>("");
  // refs
  const abortRef = useRef<(() => void) | null>(null);
  // params
  const { workspaceSlug, projectId } = useParams();
  // form info
  const { control, reset, watch } = useForm<TFormValues>({
    defaultValues,
  });
  // parse editor content (used for markdown export)
  const { replaceCustomComponentsFromMarkdownContent } = useParseEditorContent({
    projectId,
    workspaceSlug: workspaceSlug ?? "",
  });
  // derived values
  const selectedExportFormat = watch("export_format");
  const selectedPageFormat = watch("page_format");
  const selectedContentVariety = watch("content_variety");
  const isPDFSelected = selectedExportFormat === "pdf";
  const isExporting = exportState === "exporting";
  const isCancelling = exportState === "cancelling";
  const fileName = pageTitle
    ?.toLowerCase()
    ?.replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-");
  // handle modal close
  const handleClose = useCallback(() => {
    if (isExporting || isCancelling) return;
    onClose();
    setTimeout(() => {
      reset();
      setExportState("idle");
      setErrorMessage("");
    }, 300);
  }, [isExporting, isCancelling, onClose, reset]);

  // handle cancel during export
  const handleCancel = useCallback(() => {
    setExportState("cancelling");
    abortRef.current?.();
    abortRef.current = null;
    setTimeout(() => {
      onClose();
      setTimeout(() => {
        reset();
        setExportState("idle");
        setErrorMessage("");
      }, 300);
    }, 300);
  }, [onClose, reset]);

  const initiateDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // handle export as a PDF via SSE
  const handleExportAsPDF = () => {
    if (!workspaceSlug) throw new Error("Workspace slug is required");

    setExportState("exporting");

    const pdfFileName = `${fileName}-${selectedPageFormat.toString().toLowerCase()}.pdf`;

    try {
      const abort = liveService.exportToPdfWithProgress(
        {
          pageId,
          workspaceSlug: workspaceSlug.toString(),
          projectId: projectId?.toString(),
          teamspaceId,
          title: pageTitle,
          pageSize: selectedPageFormat,
          fileName: pdfFileName,
          noAssets: selectedContentVariety === "no-assets",
        },
        {
          onProgress: () => {},
          onComplete: (blob) => {
            initiateDownload(blob, pdfFileName);
            setExportState("complete");
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page exported successfully.",
            });
            handleClose();
          },
          onError: (error) => {
            setExportState("error");
            setErrorMessage(error.message || "Export failed. Please try again.");
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Export failed",
              message: error.message || "Page could not be exported. Please try again.",
            });
          },
        }
      );

      abortRef.current = abort;
    } catch {
      setExportState("error");
      setErrorMessage("Could not start export. Please check your connection and try again.");
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Export failed",
        message: "Could not start export. Please try again.",
      });
    }
  };

  // handle export as markdown
  const handleExportAsMarkdown = () => {
    setExportState("exporting");
    try {
      const markdownContent = editorRef?.getMarkDown() ?? "";
      const parsedMarkdownContent = replaceCustomComponentsFromMarkdownContent({
        markdownContent,
        noAssets: selectedContentVariety === "no-assets",
      });

      const blob = new Blob([parsedMarkdownContent], { type: "text/markdown" });
      initiateDownload(blob, `${fileName}.md`);
      setExportState("complete");
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Page exported successfully.",
      });
      handleClose();
    } catch {
      setExportState("error");
      setErrorMessage("Failed to export as Markdown. Please try again.");
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Export failed",
        message: "Page could not be exported as Markdown.",
      });
    }
  };

  // handle export
  const handleExport = () => {
    if (selectedExportFormat === "pdf") {
      handleExportAsPDF();
    }
    if (selectedExportFormat === "markdown") {
      handleExportAsMarkdown();
    }
  };

  const handleRetry = () => {
    setExportState("idle");
    setErrorMessage("");
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.SM}>
      <div>
        <div className="p-5 space-y-5">
          <h3 className="text-18 font-medium text-secondary">Export page</h3>

          {exportState === "error" && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-13 text-red-500">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h6 className="flex-shrink-0 text-13 text-secondary">Export format</h6>
              <Controller
                control={control}
                name="export_format"
                render={({ field: { onChange, value } }) => (
                  <CustomSelect
                    label={EXPORT_FORMATS.find((format) => format.key === value)?.label}
                    buttonClassName="border-none"
                    value={value}
                    onChange={(val: TExportFormats) => onChange(val)}
                    className="flex-shrink-0"
                    placement="bottom-end"
                    disabled={isExporting || isCancelling}
                  >
                    {EXPORT_FORMATS.map((format) => (
                      <CustomSelect.Option key={format.key} value={format.key}>
                        {format.label}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <h6 className="flex-shrink-0 text-13 text-secondary">Include content</h6>
              <Controller
                control={control}
                name="content_variety"
                render={({ field: { onChange, value } }) => (
                  <CustomSelect
                    label={CONTENT_VARIETY.find((variety) => variety.key === value)?.label}
                    buttonClassName="border-none"
                    value={value}
                    onChange={(val: TContentVariety) => onChange(val)}
                    className="flex-shrink-0"
                    placement="bottom-end"
                    disabled={isExporting || isCancelling}
                  >
                    {CONTENT_VARIETY.map((variety) => (
                      <CustomSelect.Option key={variety.key} value={variety.key}>
                        {variety.label}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
            </div>
            {isPDFSelected && (
              <div className="flex items-center justify-between gap-2">
                <h6 className="flex-shrink-0 text-13 text-secondary">Page format</h6>
                <Controller
                  control={control}
                  name="page_format"
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      label={PAGE_FORMATS.find((format) => format.key === value)?.label}
                      buttonClassName="border-none"
                      value={value}
                      onChange={(val: TPageFormats) => onChange(val)}
                      className="flex-shrink-0"
                      placement="bottom-end"
                      disabled={isExporting || isCancelling}
                    >
                      {PAGE_FORMATS.map((format) => (
                        <CustomSelect.Option key={format.key.toString()} value={format.key}>
                          {format.label}
                        </CustomSelect.Option>
                      ))}
                    </CustomSelect>
                  )}
                />
              </div>
            )}
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
          <Button
            variant="secondary"
            size="lg"
            onClick={isExporting || isCancelling ? handleCancel : handleClose}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : isExporting ? "Cancel" : "Close"}
          </Button>
          {exportState === "error" ? (
            <Button variant="primary" size="lg" onClick={handleRetry}>
              Try again
            </Button>
          ) : (
            <Button variant="primary" size="lg" disabled={isExporting || isCancelling} onClick={handleExport}>
              {isExporting && <LoaderCircle className="size-3.5 animate-spin" />}
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
}
