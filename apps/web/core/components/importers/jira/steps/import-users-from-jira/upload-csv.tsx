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

import { useCallback, useEffect, useState } from "react";
import Papa from "papaparse";
import { useDropzone } from "react-dropzone";
import { AlertTriangle, File as FileIcon, Upload } from "lucide-react";
// helpers
import { useTranslation } from "@plane/i18n";
import { CloseIcon } from "@plane/propel/icons";

type TImportUsersFromJiraUploader = {
  handleValue: (value: string | undefined) => void;
};

type TFileStatus = "processing" | "success" | "missing-fields" | "error";

export function ImportUsersFromJiraUploader(props: TImportUsersFromJiraUploader) {
  const { handleValue } = props;
  const { t } = useTranslation();

  const [file, setFile] = useState<File | undefined>();
  const [status, setStatus] = useState<TFileStatus | undefined>();
  const [errorDetail, setErrorDetail] = useState<string | undefined>();

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const validateCsv = (data: string[]): { valid: boolean; missing?: string[] } => {
    if (data.length === 0) return { valid: false, missing: [] };
    const header = data[0] ?? "";
    const required = ["User name", "email"];
    const missing = required.filter((field) => !header.includes(field));
    return { valid: missing.length === 0, missing };
  };

  const processFile = (incoming: File) => {
    setFile(incoming);
    setStatus("processing");
    setErrorDetail(undefined);

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      Papa.parse<string>(csvContent, {
        skipEmptyLines: true,
        complete: (results) => {
          const { valid, missing } = validateCsv(results.data);
          if (valid) {
            setStatus("success");
            handleValue(csvContent);
          } else {
            setStatus("missing-fields");
            setErrorDetail(missing && missing.length > 0 ? `Missing: ${missing.join(", ")}` : "CSV is empty.");
            handleValue(undefined);
          }
        },
        error: (error: Error) => {
          setStatus("error");
          setErrorDetail(error.message);
          handleValue(undefined);
        },
      });
    };
    reader.onerror = () => {
      setStatus("error");
      setErrorDetail("Failed to read file.");
      handleValue(undefined);
    };
    reader.readAsText(incoming);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csv = acceptedFiles.find((f) => f.name.toLowerCase().endsWith(".csv"));
    if (csv) processFile(csv);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    disabled: !!file,
  });

  const handleClear = () => {
    setFile(undefined);
    setStatus(undefined);
    setErrorDetail(undefined);
    handleValue(undefined);
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  if (!file) {
    return (
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? "border-accent-strong bg-accent-primary/10"
            : "border-subtle-1 hover:border-strong-1 hover:bg-layer-1"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-layer-1 flex items-center justify-center text-tertiary">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-14 font-medium text-primary">
              {isDragActive ? "Drop CSV here" : t("file_upload.upload_text")}
            </h3>
            <p className="mt-1 text-12 text-tertiary">{t("file_upload.drag_drop_text")}</p>
            <p className="mt-1 text-11 text-placeholder">Only .csv files exported from Jira are supported.</p>
          </div>
          <button
            type="button"
            className="mt-1 px-3 py-1.5 bg-accent-primary text-on-color rounded-md text-12 font-medium hover:bg-accent-primary/80 focus:outline-none focus:ring-2 focus:ring-accent-strong"
          >
            Select file
          </button>
        </div>
      </div>
    );
  }

  const isProcessing = status === "processing";
  const isSuccess = status === "success";
  const isMissing = status === "missing-fields";
  const isError = status === "error";
  const hasError = isMissing || isError;

  return (
    <div className="border border-subtle-1 rounded-lg p-4 bg-surface-1 shadow-raised-100">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 flex-shrink-0 bg-accent-primary/10 rounded-md flex items-center justify-center text-accent-primary">
            <FileIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-13 font-medium text-primary truncate">{file.name}</h3>
            <p className="text-11 text-tertiary truncate">
              {formatSize(file.size)}
              {isProcessing && <span> • {t("file_upload.processing")}</span>}
              {hasError && errorDetail && <span className="text-danger-primary"> • {errorDetail}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          {isSuccess && (
            <span className="text-11 font-medium px-2.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary">
              Ready
            </span>
          )}
          {hasError && (
            <span className="text-11 font-medium px-2.5 py-0.5 rounded-full bg-danger-subtle text-danger-primary flex items-center gap-1">
              <AlertTriangle size={12} />
              {isMissing ? t("file_upload.missing_fields") : "Error"}
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="text-tertiary hover:text-secondary focus:outline-none"
            disabled={isProcessing}
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
