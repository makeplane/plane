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

import type { DropzoneState } from "react-dropzone";
import { Upload, File as FileIcon, X, Loader2, Download } from "lucide-react";
import { Dialog } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { csvDownload } from "@plane/utils";

type UploadViewProps = {
  file: File | null;
  isImporting: boolean;
  progress: "idle" | "uploading" | "importing";
  dropzone: DropzoneState;
  onFileRemove: () => void;
  onImport: () => void;
  onClose: () => void;
};

export const UploadView = (props: UploadViewProps) => {
  const { file, isImporting, progress, dropzone, onFileRemove, onImport, onClose } = props;

  const { t } = useTranslation();

  const { getRootProps, getInputProps, isDragActive } = dropzone;

  const handleDownloadSampleCSV = () => {
    csvDownload(
      [
        ["email", "role"],
        ["alice@example.com", "15"],
        ["bob@example.com", "20"],
        ["carol@example.com", "5"],
      ],
      "project-members-import-sample"
    );
  };
  return (
    <>
      <Dialog.Title className="text-h5-medium text-primary">{t("project.members_import.title")}</Dialog.Title>

      <p className="mt-2 text-body-xs-regular text-tertiary">{t("project.members_import.description")}</p>

      <Button variant="link" onClick={handleDownloadSampleCSV} prependIcon={<Download />} className="mt-2 px-0">
        {t("project.members_import.download_sample")}
      </Button>

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
                ? t("project.members_import.dropzone.active")
                : t("project.members_import.dropzone.inactive")}
            </p>
            <p className="text-body-xs-regular text-tertiary mt-1">{t("project.members_import.dropzone.file_type")}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-layer-1 rounded-lg">
            <FileIcon className="h-8 w-8 text-tertiary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm-medium text-primary truncate">{file.name}</p>
              <p className="text-body-xs-regular text-tertiary">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            {!isImporting && (
              <IconButton
                variant="ghost"
                onClick={onFileRemove}
                icon={X}
                className="p-1 hover:bg-layer-1-hover rounded"
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" size="lg" onClick={onClose} disabled={isImporting}>
          {t("project.members_import.buttons.cancel")}
        </Button>
        <Button variant="primary" size="lg" onClick={onImport} disabled={!file || isImporting}>
          {isImporting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progress === "uploading"
                ? t("project.members_import.progress.uploading")
                : t("project.members_import.progress.importing")}
            </span>
          ) : (
            t("project.members_import.buttons.import")
          )}
        </Button>
      </div>
    </>
  );
};
