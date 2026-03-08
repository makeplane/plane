// [FA-CUSTOM] Step 1: Upload CSV/XLSX and preview

import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import type { TUploadResponse } from "@/services/import.service";
import type { UseImportWizardReturn } from "../hooks/use-import-wizard";

type Props = {
  wizard: UseImportWizardReturn;
};

const PRESET_LABELS: Record<string, string> = {
  clickup: "ClickUp",
  jira: "Jira",
  trello: "Trello",
  notion: "Notion",
  generic: "Unknown",
};

export function StepUpload({ wizard }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const name = file.name.toLowerCase();
      if (!name.endsWith(".csv") && !name.endsWith(".xlsx")) {
        return;
      }
      void wizard.uploadFile(file);
    },
    [wizard]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (wizard.isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Loader className="mx-auto w-full max-w-md">
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
        </Loader>
        <p className="text-caption-md-regular text-tertiary">Parsing file...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors",
          dragOver ? "border-accent-primary bg-accent-subtle-hover/30" : "border-subtle"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
      >
        <Upload className="size-10 text-tertiary" />
        <div className="text-center">
          <p className="text-body-sm-medium text-primary">Drop your CSV or XLSX file here</p>
          <p className="mt-1 text-caption-md-regular text-tertiary">or click to browse</p>
        </div>
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleInputChange} className="hidden" />
      </div>

      {/* Error */}
      {wizard.error && (
        <div className="rounded-md bg-danger-subtle p-3 text-body-xs-regular text-danger-primary">{wizard.error}</div>
      )}

      {/* Preview (shown after upload, if uploadData exists but step hasn't advanced yet) */}
      {wizard.uploadData && wizard.step === "upload" && <PreviewSection data={wizard.uploadData} />}
    </div>
  );
}

function PreviewSection({ data }: { data: TUploadResponse }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="size-5 text-accent-primary" />
        <div>
          <p className="text-body-sm-medium text-primary">{data.file_name}</p>
          <p className="text-caption-md-regular text-tertiary">
            {data.total_rows} rows found
            {data.detected_preset !== "generic" && (
              <>
                {" "}
                &middot; Detected:{" "}
                <span className="text-caption-md-medium">
                  {PRESET_LABELS[data.detected_preset] ?? data.detected_preset}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Preview table */}
      {data.preview_rows?.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-subtle">
          <table className="min-w-full">
            <thead>
              <tr className="bg-layer-3">
                {data.detected_columns.map((col: string) => (
                  <th key={col} className="whitespace-nowrap px-3 py-2 text-left text-caption-md-medium text-secondary">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.preview_rows.map((row: Record<string, string>, idx: number) => (
                <tr key={idx} className="border-t border-subtle">
                  {data.detected_columns.map((col: string) => (
                    <td
                      key={col}
                      className="max-w-[200px] truncate whitespace-nowrap px-3 py-2 text-caption-md-regular text-tertiary"
                    >
                      {row[col] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
