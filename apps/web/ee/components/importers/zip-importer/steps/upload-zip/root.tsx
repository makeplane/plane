import { FC, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, AlertTriangle, CircleCheck, CircleAlert } from "lucide-react";
import { IMPORTER_TRACKER_EVENTS } from "@plane/constants";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { Button, CircularProgressIndicator, setToast, TOAST_TYPE } from "@plane/ui";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useZipImporter } from "@/plane-web/hooks/store/importers/use-zip-importer";
import { UploadState } from "@/plane-web/store/importers/zip-importer/root.store";
import { E_IMPORTER_STEPS, TZipImporterProps } from "@/plane-web/types/importers/zip-importer";
import { StepperNavigation } from "../../../ui";

interface UploadedFile {
  file: File;
}

export const UploadZip: FC<TZipImporterProps> = observer(({ driverType, serviceName }) => {
  // hooks
  const { t } = useTranslation();

  const {
    currentStep,
    handleDashboardView,
    handleStepper,
    handleImporterData,
    uploadZipFile,
    uploadState,
    uploadProgress,
    uploadError,
    confirmAndStartImport,
    workspace,
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
      captureSuccess({
        eventName: IMPORTER_TRACKER_EVENTS.UPLOAD_ZIP_FILE,
        payload: {
          serviceName,
        },
      });
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
        captureSuccess({
          eventName: IMPORTER_TRACKER_EVENTS.CREATE_IMPORTER_JOB,
          payload: {
            type: E_IMPORTER_KEYS.NOTION,
          },
        });
        captureSuccess({
          eventName: IMPORTER_TRACKER_EVENTS.START_IMPORTER_JOB,
          payload: {
            type: E_IMPORTER_KEYS.NOTION,
          },
        });
        // Show success toast
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Import started",
          message: `Your ${serviceName} import has been started successfully.`,
        });
        // Now proceed to next step
        handleDashboardView();
      } catch (error) {
        console.error(`Failed to confirm upload: ${error}`);
        // Show error toast
        captureError({
          eventName: IMPORTER_TRACKER_EVENTS.CREATE_IMPORTER_JOB,
          error: error as Error,
          payload: {
            type: E_IMPORTER_KEYS.NOTION,
          },
        });
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
                ? "border-custom-primary-100 bg-custom-primary-100/10"
                : "border-custom-border-200 hover:border-custom-border-400 hover:bg-custom-background-90"
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-custom-background-90 flex items-center justify-center text-custom-text-300">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-custom-text-100">
                {isDragActive
                  ? t(`${driverType}_importer.upload.drop_file_here`)
                  : t(`${driverType}_importer.upload.upload_title`)}
              </h3>
              <p className="mt-1 text-sm text-custom-text-300">
                {t(`${driverType}_importer.upload.drag_drop_description`)}
              </p>
              <p className="mt-2 text-xs text-custom-text-400">
                {t(`${driverType}_importer.upload.file_type_restriction`)}
              </p>
            </div>
            <button
              type="button"
              className="mt-2 px-4 py-2 bg-custom-primary-100 text-white rounded-md text-sm font-medium hover:bg-custom-primary-200 focus:outline-none focus:ring-2 focus:ring-custom-primary-100"
            >
              {t(`${driverType}_importer.upload.select_file`)}
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-custom-border-200 rounded-lg p-6 bg-custom-background-100 shadow-custom-shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex-shrink-0 bg-custom-primary-100/10 rounded-md flex items-center justify-center text-custom-primary-100">
                <File className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-custom-text-100 truncate">
                  {uploadedFile.file.name.replace(/\.zip$/i, "").substring(0, 40) +
                    (uploadedFile.file.name.length > 40 ? "..." : "")}
                </h3>
                <p className="text-xs text-custom-text-300">
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
                  <CircularProgressIndicator
                    size={40}
                    percentage={isConfirming ? 100 : uploadProgress}
                    strokeWidth={4}
                    strokeColor="stroke-custom-primary-100"
                  >
                    <span className="text-[10px] font-medium text-custom-text-300">
                      {isConfirming ? "..." : `${uploadProgress}%`}
                    </span>
                  </CircularProgressIndicator>
                </div>
              ) : uploadState === UploadState.COMPLETE ? (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-custom-primary-100/10 text-custom-primary-100">
                  {t(`${driverType}_importer.upload.ready`)}
                </span>
              ) : uploadState === UploadState.ERROR ? (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {t(`${driverType}_importer.upload.error`)}
                </span>
              ) : null}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-custom-text-300 hover:text-custom-text-200 focus:outline-none"
                disabled={isUploading || isConfirming}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {(isUploading || isConfirming) && (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-custom-background-80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-custom-primary-100 rounded-full transition-all duration-300"
                  style={{ width: `${isConfirming ? 100 : uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-custom-text-300">
                {getStatusText()} • {t(`${driverType}_importer.upload.upload_progress_message`)}
              </p>
            </div>
          )}

          {uploadState === UploadState.ERROR && uploadError && (
            <div className="mt-4 text-xs bg-custom-background-80 p-4 rounded-md flex gap-3">
              <div className="flex-shrink-0 text-red-500 mt-0.5">
                <CircleAlert className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-red-600 mb-1">Upload failed</div>
                <div className="text-red-500">{uploadError}</div>
              </div>
            </div>
          )}

          {uploadState === UploadState.COMPLETE && !isConfirming && (
            <div className="mt-4 text-xs bg-custom-primary-100/5 border border-custom-primary-100/20 p-4 rounded-md flex gap-3">
              <div className="flex-shrink-0 text-custom-primary-100 mt-0.5">
                <CircleCheck className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-custom-primary-100 mb-1">
                  {t(`${driverType}_importer.upload.upload_complete_message`)}
                </div>
                <div className="text-custom-text-300">
                  {t(`${driverType}_importer.upload.upload_complete_description`)}
                </div>
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
            size="sm"
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
