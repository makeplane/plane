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

import React, { useState, useCallback, Fragment } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import type { DropzoneState } from "react-dropzone";
import { Upload, File, X, Loader2, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EFileAssetType } from "@plane/types";
import type { TWorkspaceMemberImportSummary } from "@plane/types";
import { Button, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { WorkspaceService } from "@/services/workspace.service";
import { FileService } from "@/services/file.service";

const fileService = new FileService();
const workspaceService = new WorkspaceService();

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
};

const getSeatLimitError = (summary: TWorkspaceMemberImportSummary | null): string | null => {
  if (!summary?.errors) return null;

  if (typeof summary.errors === "object" && !Array.isArray(summary.errors)) {
    const firstError = Object.values(summary.errors)[0];
    if (firstError && typeof firstError === "object" && "_list_error" in firstError) {
      const listError = (firstError as unknown as { _list_error: string[] })._list_error;
      return Array.isArray(listError) ? listError[0] : String(listError);
    }
  }

  return null;
};

const downloadErrors = (errors: Record<number, Record<string, string>>) => {
  const lines: string[] = ["Failed Import Rows", "=".repeat(40), ""];

  Object.entries(errors).forEach(([rowNum, rowErrors]) => {
    if (typeof rowErrors === "object" && !("_list_error" in rowErrors)) {
      lines.push(`Row ${rowNum}:`);
      Object.entries(rowErrors).forEach(([field, message]) => {
        lines.push(`  ${field}: ${message}`);
      });
      lines.push("");
    }
  });

  if (lines.length <= 3) return;

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "import-errors.txt";
  a.click();
  URL.revokeObjectURL(url);
};

type SummaryViewProps = {
  summary: TWorkspaceMemberImportSummary;
  onClose: () => void;
  onReset: () => void;
};

const SummaryView: React.FC<SummaryViewProps> = ({ summary, onClose, onReset }) => {
  const { t } = useTranslation();
  const seatLimitError = getSeatLimitError(summary);
  const isSuccess = summary.successful > 0 && !seatLimitError;

  const handleDownload = () => {
    if (typeof summary.errors === "object" && !Array.isArray(summary.errors)) {
      downloadErrors(summary.errors);
    }
  };

  return (
    <>
      {/* Title with status */}
      <div className="flex items-center gap-2">
        {seatLimitError ? (
          <AlertCircle className="h-5 w-5 text-danger" />
        ) : isSuccess ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <AlertCircle className="h-5 w-5 text-warning" />
        )}
        <Dialog.Title className="text-h5-medium text-primary">
          {seatLimitError
            ? t("workspace.members_import.summary.title.failed")
            : t("workspace.members_import.summary.title.complete")}
        </Dialog.Title>
      </div>

      {/* Description */}
      <p className="mt-2 text-body-sm-regular text-secondary">
        {seatLimitError
          ? t("workspace.members_import.summary.message.seat_limit")
          : summary.successful > 0
            ? t("workspace.members_import.summary.message.success", {
                count: summary.successful,
                plural: summary.successful !== 1 ? "s" : "",
              })
            : t("workspace.members_import.summary.message.no_imports")}
      </p>

      {/* Seat Limit Error Detail */}
      {seatLimitError && (
        <div className="mt-4 rounded-lg bg-danger-subtle px-4 py-3">
          <p className="text-body-sm-regular text-danger">{seatLimitError}</p>
        </div>
      )}

      {/* Stats Bar - only show when there are failed rows */}
      {!seatLimitError && summary.failed > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-layer-1 border border-subtle px-4 py-3">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-caption-md-regular text-tertiary">
                {t("workspace.members_import.summary.stats.successful")}
              </p>
              <p className="text-h5-medium text-success mt-2">{summary.successful}</p>
            </div>
            <div>
              <p className="text-caption-md-regular text-tertiary">
                {t("workspace.members_import.summary.stats.failed")}
              </p>
              <p className="text-h5-medium text-danger mt-2">{summary.failed}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 text-body-xs-regular text-link-primary hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            {t("workspace.members_import.summary.download_errors")}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        {seatLimitError ? (
          <>
            <Button variant="neutral-primary" size="sm" onClick={onReset}>
              {t("workspace.members_import.buttons.try_again")}
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              {t("workspace.members_import.buttons.close")}
            </Button>
          </>
        ) : (
          <Button variant="primary" size="sm" onClick={onClose}>
            {t("workspace.members_import.buttons.done")}
          </Button>
        )}
      </div>
    </>
  );
};

type UploadViewProps = {
  file: File | null;
  isImporting: boolean;
  progress: "idle" | "uploading" | "importing";
  dropzone: DropzoneState;
  onFileRemove: () => void;
  onImport: () => void;
  onClose: () => void;
};

const UploadView: React.FC<UploadViewProps> = ({
  file,
  isImporting,
  progress,
  dropzone,
  onFileRemove,
  onImport,
  onClose,
}) => {
  const { t } = useTranslation();
  const { getRootProps, getInputProps, isDragActive } = dropzone;

  return (
    <>
      <Dialog.Title className="text-h5-medium text-primary">{t("workspace.members_import.title")}</Dialog.Title>

      <p className="mt-2 text-body-xs-regular text-tertiary">{t("workspace.members_import.description")}</p>

      <div className="mt-4">
        {!file ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragActive ? "border-accent-strong bg-accent-subtle" : "border-subtle hover:border-strong"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 text-tertiary mb-2" />
            <p className="text-body-sm-regular text-secondary">
              {isDragActive
                ? t("workspace.members_import.dropzone.active")
                : t("workspace.members_import.dropzone.inactive")}
            </p>
            <p className="text-body-xs-regular text-tertiary mt-1">
              {t("workspace.members_import.dropzone.file_type")}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-layer-1 rounded-lg">
            <File className="h-8 w-8 text-tertiary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm-medium text-primary truncate">{file.name}</p>
              <p className="text-body-xs-regular text-tertiary">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {!isImporting && (
              <button onClick={onFileRemove} className="p-1 hover:bg-layer-1-hover rounded">
                <X className="h-4 w-4 text-tertiary" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isImporting}>
          {t("workspace.members_import.buttons.cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={onImport} disabled={!file || isImporting}>
          {isImporting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progress === "uploading"
                ? t("workspace.members_import.progress.uploading")
                : t("workspace.members_import.progress.importing")}
            </span>
          ) : (
            t("workspace.members_import.buttons.import")
          )}
        </Button>
      </div>
    </>
  );
};

export const MembersImportModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, workspaceSlug } = props;
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<"idle" | "uploading" | "importing">("idle");
  const [summary, setSummary] = useState<TWorkspaceMemberImportSummary | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const csvFile = acceptedFiles.find((f) => f.name.endsWith(".csv") || f.type === "text/csv");
      if (csvFile) {
        setFile(csvFile);
      } else if (acceptedFiles.length > 0) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace.members_import.toast.invalid_file.title"),
          message: t("workspace.members_import.toast.invalid_file.message"),
        });
      }
    },
    [t]
  );

  const dropzone = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
    disabled: isImporting,
  });

  const handleClose = () => {
    if (isImporting) return;
    setFile(null);
    setProgress("idle");
    setSummary(null);
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setProgress("idle");
    setSummary(null);
  };

  const handleImport = async () => {
    if (!file || !workspaceSlug || !currentWorkspace) return;

    setIsImporting(true);
    setProgress("uploading");

    try {
      const uploadResponse = await fileService.uploadWorkspaceAsset(
        workspaceSlug,
        { entity_identifier: currentWorkspace.id, entity_type: EFileAssetType.WORKSPACE_MEMBERS_IMPORT },
        file
      );

      setProgress("importing");

      const result = await workspaceService.importMembers(workspaceSlug, uploadResponse.asset_id);
      setSummary(result);
    } catch (error) {
      const err = error as { error?: string; message?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace.members_import.toast.import_failed.title"),
        message: err?.error || err?.message || t("workspace.members_import.toast.import_failed.message"),
      });
    } finally {
      setIsImporting(false);
      setProgress("idle");
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.LG}>
      <div className="p-4">
        {summary ? (
          <SummaryView summary={summary} onClose={handleClose} onReset={handleReset} />
        ) : (
          <UploadView
            file={file}
            isImporting={isImporting}
            progress={progress}
            dropzone={dropzone}
            onFileRemove={() => setFile(null)}
            onImport={() => void handleImport()}
            onClose={handleClose}
          />
        )}
      </div>
    </ModalCore>
  );
});
