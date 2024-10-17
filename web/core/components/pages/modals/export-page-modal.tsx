"use client";

import { useState } from "react";
import { PageProps, pdf } from "@react-pdf/renderer";
import { Controller, useForm } from "react-hook-form";
// plane editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// plane ui
import { Button, CustomSelect, EModalPosition, EModalWidth, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { PDFDocument } from "@/components/editor";
// helpers
import {
  replaceCustomComponentsFromHTMLContent,
  replaceCustomComponentsFromMarkdownContent,
} from "@/helpers/editor.helper";

type Props = {
  editorRef: EditorRefApi | EditorReadOnlyRefApi | null;
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
};

type TExportFormats = "pdf" | "markdown";
type TPageFormats = Exclude<PageProps["size"], undefined>;
type TContentVariety = "everything" | "no-assets";

type TFormValues = {
  export_format: TExportFormats;
  page_format: TPageFormats;
  content_variety: TContentVariety;
};

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

export const ExportPageModal: React.FC<Props> = (props) => {
  const { editorRef, isOpen, onClose, pageTitle } = props;
  // states
  const [isExporting, setIsExporting] = useState(false);
  // form info
  const { control, reset, watch } = useForm<TFormValues>({
    defaultValues,
  });
  // derived values
  const selectedExportFormat = watch("export_format");
  const selectedPageFormat = watch("page_format");
  const selectedContentVariety = watch("content_variety");
  const isPDFSelected = selectedExportFormat === "pdf";
  const fileName = pageTitle
    ?.toLowerCase()
    ?.replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-");
  // handle modal close
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      reset();
    }, 300);
  };

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

  // handle export as a PDF
  const handleExportAsPDF = async () => {
    try {
      const pageContent = `<h1 class="page-title">${pageTitle}</h1>${editorRef?.getDocument().html ?? "<p></p>"}`;
      const parsedPageContent = await replaceCustomComponentsFromHTMLContent({
        htmlContent: pageContent,
        noAssets: selectedContentVariety === "no-assets",
      });

      const blob = await pdf(<PDFDocument content={parsedPageContent} pageFormat={selectedPageFormat} />).toBlob();
      initiateDownload(blob, `${fileName}-${selectedPageFormat.toString().toLowerCase()}.pdf`);
    } catch (error) {
      throw new Error(`Error in exporting as a PDF: ${error}`);
    }
  };
  // handle export as markdown
  const handleExportAsMarkdown = async () => {
    try {
      const markdownContent = editorRef?.getMarkDown() ?? "";
      const parsedMarkdownContent = replaceCustomComponentsFromMarkdownContent({
        markdownContent,
        noAssets: selectedContentVariety === "no-assets",
      });

      const blob = new Blob([parsedMarkdownContent], { type: "text/markdown" });
      initiateDownload(blob, `${fileName}.md`);
    } catch (error) {
      throw new Error(`Error in exporting as markdown: ${error}`);
    }
  };
  // handle export
  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedExportFormat === "pdf") {
        await handleExportAsPDF();
      }
      if (selectedExportFormat === "markdown") {
        await handleExportAsMarkdown();
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Page exported successfully.",
      });
      handleClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be exported. Please try again later.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.SM}>
      <div>
        <div className="p-5 space-y-5">
          <h3 className="text-xl font-medium text-custom-text-200">Export page</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h6 className="flex-shrink-0 text-sm text-custom-text-200">Export format</h6>
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
              <h6 className="flex-shrink-0 text-sm text-custom-text-200">Include content</h6>
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
                <h6 className="flex-shrink-0 text-sm text-custom-text-200">Page format</h6>
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
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={isExporting} onClick={handleExport}>
            {isExporting ? "Exporting" : "Export"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
};
