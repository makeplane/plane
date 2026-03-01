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

import { useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
// types
import { EFileAssetType } from "@plane/types";
// ui
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// utils
import { cn } from "@plane/utils";
// icons
import { FileText, Upload, CheckCircle2, AlertCircle, Loader, AlertTriangle } from "lucide-react";
// propel icons
import { CloseIcon } from "@plane/propel/icons";
// components
import { StepperNavigation } from "@/components/importers/ui/stepper";
// hooks
import { useCSVImporter } from "@/plane-web/hooks/store";
// services
import { FileService } from "@/services/file.service";

const fileService = new FileService();

type ImportStatus = "idle" | "uploading" | "importing" | "success" | "error";

/**
 * Upload CSV step for work item import.
 * Handles file selection, upload, and triggering the import job.
 */
export const UploadCSV = observer(function UploadCSV() {
  // hooks
  const {
    workspace,
    currentStep,
    handleStepper,
    importerData,
    triggerImport,
    isImporting,
    resetImporterData,
    handleDashboardView,
  } = useCSVImporter();

  // states
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // derived values
  const workspaceSlug = workspace?.slug;
  const workspaceId = workspace?.id;
  const projectId = importerData["select-plane-project"]?.projectId;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (csvFile && (csvFile.type === "text/csv" || csvFile.name.endsWith(".csv"))) {
      setFile(csvFile);
      setError(null);
      setStatus("idle");
    } else {
      setError("Please upload a valid CSV file");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    disabled: status === "uploading" || status === "importing",
  });

  const removeFile = () => {
    setFile(null);
    setError(null);
    setStatus("idle");
  };

  const handleImport = async () => {
    if (!file || !workspaceSlug || !workspaceId || !projectId) return;

    setStatus("uploading");
    setError(null);

    try {
      // Step 1: Upload file to get asset_id
      const uploadResponse = await fileService.uploadWorkspaceAsset(
        workspaceSlug,
        {
          entity_identifier: workspaceId,
          entity_type: EFileAssetType.WORK_ITEM_IMPORT,
        },
        file
      );

      setStatus("importing");

      // Step 2: Trigger import with asset_id
      await triggerImport(uploadResponse.asset_id);

      setStatus("success");
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Import Started",
        message: "Your work items are being imported. This may take a few minutes.",
      });

      // Reset and redirect to dashboard after successful import
      resetImporterData();
      handleDashboardView();
    } catch (err) {
      setStatus("error");
      const errorMessage = err instanceof Error ? err.message : "Failed to import CSV";
      setError(errorMessage);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Import Failed",
        message: errorMessage,
      });
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "uploading":
        return "Uploading file...";
      case "importing":
        return "Starting import...";
      case "success":
        return "Import started successfully!";
      case "error":
        return error || "Import failed";
      default:
        return null;
    }
  };

  return (
    <div className="relative size-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-4">
        <div className="text-body-sm-regular text-secondary">Upload CSV file</div>

        {/* Drop zone or uploaded file display */}
        {!file ? (
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
              isDragActive ? "border-primary bg-primary/10" : "border-subtle hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="size-8 text-tertiary mb-3" />
            <p className="text-body-sm-regular text-secondary text-center">
              {isDragActive ? "Drop the CSV file here" : "Drag and drop a CSV file, or click to select"}
            </p>
            <p className="text-caption-md-regular text-tertiary mt-1">Only .csv files are supported</p>
          </div>
        ) : (
          <div className="border border-subtle-1 rounded-lg p-6 bg-surface-1 shadow-custom-shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 flex-shrink-0 bg-accent-primary/10 rounded-md flex items-center justify-center text-accent-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-13 font-medium text-primary truncate">
                    {(() => {
                      const nameWithoutExt = file.name.replace(/\.csv$/i, "");
                      return nameWithoutExt.length > 40 ? nameWithoutExt.substring(0, 40) + "..." : nameWithoutExt;
                    })()}
                  </h3>
                  <p className="text-11 text-tertiary">
                    {file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(2)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
                    {(status === "uploading" || status === "importing") && <span> • {getStatusText()}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {status === "uploading" || status === "importing" ? (
                  <div className="flex items-center gap-2">
                    <Loader className="size-5 animate-spin text-primary" />
                  </div>
                ) : status === "success" ? (
                  <span className="text-11 font-medium px-2.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Ready
                  </span>
                ) : status === "error" ? (
                  <span className="text-11 font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Error
                  </span>
                ) : (
                  <span className="text-11 font-medium px-2.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary">
                    Ready
                  </span>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="text-tertiary hover:text-secondary focus:outline-none"
                  disabled={status === "uploading" || status === "importing"}
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status messages */}
            {status === "error" && error && (
              <div className="mt-4 text-11 bg-layer-1 p-4 rounded-md flex gap-3">
                <div className="flex-shrink-0 text-red-500 mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-red-600 mb-1">Import failed</div>
                  <div className="text-red-500">{error}</div>
                </div>
              </div>
            )}

            {status === "success" && (
              <div className="mt-4 text-11 bg-accent-primary/5 border border-accent-strong/20 p-4 rounded-md flex gap-3">
                <div className="flex-shrink-0 text-accent-primary mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-accent-primary mb-1">Import started successfully</div>
                  <div className="text-tertiary">Your work items are being imported. This may take a few minutes.</div>
                </div>
              </div>
            )}

            {(status === "uploading" || status === "importing") && (
              <div className="mt-4 text-11 bg-layer-1 p-4 rounded-md flex gap-3">
                <div className="flex-shrink-0 text-primary mt-0.5">
                  <Loader className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-primary mb-1">{getStatusText()}</div>
                  <div className="text-tertiary">Please wait while we process your file.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button
            variant="primary"
            onClick={() => void handleImport()}
            disabled={!file || status === "uploading" || status === "importing" || isImporting}
          >
            {status === "uploading" || status === "importing" || isImporting ? "Importing..." : "Import CSV"}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
