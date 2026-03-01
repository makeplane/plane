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
import { Upload, File, AlertTriangle, CircleCheck, CircleAlert } from "lucide-react";
// Plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CloseIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { CircularProgressIndicator } from "@plane/ui";
// plane web hooks
import { useZipImporter } from "@/plane-web/hooks/store/importers/use-zip-importer";
import type { TZipImporterProps } from "@/types/importers/zip-importer";
import { E_IMPORTER_STEPS } from "@/types/importers/zip-importer";
import { StepperNavigation } from "../../../ui";
import { UploadState } from "@/store/importers";

interface UploadedFile {
  file: File;
}

export const UploadZip = observer(function UploadZip({ driverType, serviceName }: TZipImporterProps) {
  // hooks
  const { t } = useTranslation();

  const {
    currentStep,
    handleStepper,
    handleImporterData,
    uploadZipFile,
    uploadState,
    uploadProgress,
    uploadError,
    confirmAndStartImport,
    workspace,
    resetImporterData,
  } = useZipImporter(driverType);

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Filter to only accept zip files
      const zipFile = acceptedFiles.find((file) => file.name.endsWith(".zip"));

      if (zipFile) {
        setUploadedFile({ file: zipFile });

        // Start the upload if workspace is available
        if (workspace?.id) {
          uploadZipFile(workspace.slug, zipFile).catch((error) => {
            // Show error toast for upload failure
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Upload failed",
              message: error instanceof Error ? error.message : "Failed to upload file. Please try again.",
            });
          });
        }
      } else if (acceptedFiles.length > 0) {
        // If files were dropped but none were zip files
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Invalid file format",
          message: `Only .zip files exported from ${serviceName} are supported.`,
        });
      }
    },
    [uploadZipFile, workspace?.id, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"],
    },
    maxFiles: 1,
    disabled: uploadState !== UploadState.IDLE && uploadState !== UploadState.ERROR,
  });

  const removeFile = () => {
    setUploadedFile(null);
    setIsConfirming(false);
  };

  const handleOnClickNext = async () => {
    if (!uploadedFile) return;

    // Update the data in the context
    handleImporterData(E_IMPORTER_STEPS.UPLOAD_ZIP, {
      zipFile: uploadedFile.file,
    });

    // If we haven't uploaded yet or we're retrying after an error
    if ((uploadState === UploadState.IDLE || uploadState === UploadState.ERROR) && workspace?.slug) {
      uploadZipFile(workspace.slug, uploadedFile.file);
      return;
    }

    // If upload is complete, confirm and start the import
    if (uploadState === UploadState.COMPLETE) {
      try {
        setIsConfirming(true);
        // Pass the file name when confirming the upload
        await confirmAndStartImport({
          fileName: uploadedFile.file.name,
        });
        // Show success toast
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Import started",
          message: `Your ${serviceName} import has been started successfully.`,
        });
        // Now proceed to next step
        resetImporterData();
      } catch (error) {
        console.error(`Failed to confirm upload: ${error}`);
        // Show error toast
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Import failed",
          message: error instanceof Error ? error.message : "Failed to start import. Please try again.",
        });
        setIsConfirming(false);
      }
    }
  };

  // Next button is disabled if:
  // - No file is uploaded
  // - Upload is in progress (not complete/idle/error)
  // - We're in the confirming process
  const isNextButtonDisabled =
    !uploadedFile ||
    (uploadState !== UploadState.COMPLETE && uploadState !== UploadState.IDLE && uploadState !== UploadState.ERROR) ||
    isConfirming;

  // Update button text based on upload state
  const getButtonText = () => {
    if (isConfirming) return t(`${driverType}_importer.upload.confirming`);

    switch (uploadState) {
      case UploadState.GETTING_UPLOAD_URL:
      case UploadState.UPLOADING:
        return t(`${driverType}_importer.upload.uploading`);
      case UploadState.CONFIRMING:
        return t(`${driverType}_importer.upload.confirming`);
      case UploadState.COMPLETE:
        return t(`${driverType}_importer.upload.start_import`);
      case UploadState.ERROR:
        return t(`${driverType}_importer.upload.retry_upload`);
      default:
        return t(`${driverType}_importer.upload.upload`);
    }
  };

  const isUploading =
    uploadState === UploadState.GETTING_UPLOAD_URL ||
    uploadState === UploadState.UPLOADING ||
    uploadState === UploadState.CONFIRMING;

  // Get status text based on upload state
  const getStatusText = () => {
    if (isConfirming) return t(`${driverType}_importer.upload.confirming_upload`);

    switch (uploadState) {
      case UploadState.GETTING_UPLOAD_URL:
        return t(`${driverType}_importer.upload.preparing_upload`);
      case UploadState.UPLOADING:
        return `${t(`${driverType}_importer.upload.uploading`)} ${uploadProgress}%`;
      case UploadState.CONFIRMING:
        return t(`${driverType}_importer.upload.confirming_upload`);
      case UploadState.COMPLETE:
        return t(`${driverType}_importer.upload.upload_complete`);
      case UploadState.ERROR:
        return t(`${driverType}_importer.upload.upload_failed`);
      default:
        return "";
    }
  };

  return (
    <div className="w-full">
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${
              isDragActive
                ? "border-accent-strong bg-accent-primary/10"
                : "border-subtle-1 hover:border-strong-1 hover:bg-layer-1"
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-layer-1 flex items-center justify-center text-tertiary">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-16 font-medium text-primary">
                {isDragActive
                  ? t(`${driverType}_importer.upload.drop_file_here`)
                  : t(`${driverType}_importer.upload.upload_title`)}
              </h3>
              <p className="mt-1 text-13 text-tertiary">{t(`${driverType}_importer.upload.drag_drop_description`)}</p>
              <p className="mt-2 text-11 text-placeholder">
                {t(`${driverType}_importer.upload.file_type_restriction`)}
              </p>
            </div>
            <button
              type="button"
              className="mt-2 px-4 py-2 bg-accent-primary text-on-color rounded-md text-13 font-medium hover:bg-accent-primary/80 focus:outline-none focus:ring-2 focus:ring-accent-strong"
            >
              {t(`${driverType}_importer.upload.select_file`)}
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-subtle-1 rounded-lg p-6 bg-surface-1 shadow-raised-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-accent-primary/10 rounded-md flex items-center justify-center text-accent-primary">
                <File className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-13 font-medium text-primary truncate">
                  {uploadedFile.file.name.replace(/\.zip$/i, "").substring(0, 40) +
                    (uploadedFile.file.name.length > 40 ? "..." : "")}
                </h3>
                <p className="text-11 text-tertiary">
                  {uploadedFile.file.size < 1024 * 1024
                    ? `${(uploadedFile.file.size / 1024).toFixed(2)} KB`
                    : `${(uploadedFile.file.size / (1024 * 1024)).toFixed(2)} MB`}
                  {(isUploading || isConfirming) && <span> • {getStatusText()}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isUploading || isConfirming ? (
                <div className="w-10 h-10 flex items-center justify-center">
                  <CircularProgressIndicator size={40} percentage={isConfirming ? 100 : uploadProgress} strokeWidth={4}>
                    <span className="text-10 font-medium text-tertiary">
                      {isConfirming ? "..." : `${uploadProgress}%`}
                    </span>
                  </CircularProgressIndicator>
                </div>
              ) : uploadState === UploadState.COMPLETE ? (
                <span className="text-11 font-medium px-2.5 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary">
                  {t(`${driverType}_importer.upload.ready`)}
                </span>
              ) : uploadState === UploadState.ERROR ? (
                <span className="text-11 font-medium px-2.5 py-0.5 rounded-full bg-danger-subtle text-danger-primary flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {t(`${driverType}_importer.upload.error`)}
                </span>
              ) : null}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-tertiary hover:text-secondary focus:outline-none"
                disabled={isUploading || isConfirming}
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {(isUploading || isConfirming) && (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-layer-1 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-primary rounded-full transition-all duration-300"
                  style={{ width: `${isConfirming ? 100 : uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-11 text-tertiary">
                {getStatusText()} • {t(`${driverType}_importer.upload.upload_progress_message`)}
              </p>
            </div>
          )}

          {uploadState === UploadState.ERROR && uploadError && (
            <div className="mt-4 text-11 bg-layer-1 p-4 rounded-md flex gap-3">
              <div className="flex-shrink-0 text-danger-primary mt-0.5">
                <CircleAlert className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-danger-primary mb-1">Upload failed</div>
                <div className="text-danger-primary">{uploadError}</div>
              </div>
            </div>
          )}

          {uploadState === UploadState.COMPLETE && !isConfirming && (
            <div className="mt-4 text-11 bg-accent-primary/5 border border-accent-strong/20 p-4 rounded-md flex gap-3">
              <div className="flex-shrink-0 text-accent-primary mt-0.5">
                <CircleCheck className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-accent-primary mb-1">
                  {t(`${driverType}_importer.upload.upload_complete_message`)}
                </div>
                <div className="text-tertiary">{t(`${driverType}_importer.upload.upload_complete_description`)}</div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* stepper button */}
      <div className="flex-shrink-0 flex justify-end items-center gap-2 mt-8">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button
            variant="primary"
            onClick={handleOnClickNext}
            disabled={isNextButtonDisabled}
            loading={isUploading || isConfirming}
          >
            {getButtonText()}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
