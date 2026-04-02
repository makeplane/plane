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
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EFileAssetType } from "@plane/types";
import type { TProjectMemberImportSummary } from "@plane/types";
import { EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useMember } from "@/hooks/store/use-member";
// services
import { ProjectService } from "@/services/project/project.service";
import { FileService } from "@/services/file.service";
// local imports
import { UploadView } from "./upload-view";
import { SummaryView } from "./summary-view";

const fileService = new FileService();
const projectService = new ProjectService();

type ProjectMembersImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
};

const ACCEPTED_CSV_MIME_TYPES = [
  "text/csv",
  "text/comma-separated-values",
  "text/x-comma-separated-values",
  "text/x-csv",
  // Retained solely because some legacy browsers (IE/Edge pre-Chromium) report .csv files
  // under this MIME type. Does NOT accept actual .xls/.xlsx content.
  "application/vnd.ms-excel",
];

export const ProjectMembersImportModal = observer((props: ProjectMembersImportModalProps) => {
  const { isOpen, onClose, workspaceSlug, projectId } = props;
  const { t } = useTranslation();

  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<"idle" | "uploading" | "importing">("idle");
  const [summary, setSummary] = useState<TProjectMemberImportSummary | null>(null);

  const {
    project: { fetchProjectMembers },
  } = useMember();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const csvFile = acceptedFiles.find((f) => ACCEPTED_CSV_MIME_TYPES.includes(f.type));
      if (csvFile) {
        setFile(csvFile);
      } else if (acceptedFiles.length > 0) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project.members_import.toast.invalid_file.title"),
          message: t("project.members_import.toast.invalid_file.message"),
        });
      }
    },
    [t]
  );

  const dropzone = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "text/comma-separated-values": [".csv"],
      "text/x-comma-separated-values": [".csv"],
      "text/x-csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
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

  const handleImport = async () => {
    if (!file || !workspaceSlug || !projectId) return;

    setIsImporting(true);
    setProgress("uploading");

    try {
      const uploadResponse = await fileService.uploadProjectAsset(
        workspaceSlug,
        projectId,
        { entity_identifier: projectId, entity_type: EFileAssetType.PROJECT_MEMBERS_IMPORT },
        file
      );

      setProgress("importing");

      const result = await projectService.importProjectMembers(workspaceSlug, projectId, uploadResponse.asset_id);
      await fetchProjectMembers(workspaceSlug, projectId);
      setSummary(result);
    } catch (error) {
      const err = error as { error?: string; message?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project.members_import.toast.import_failed.title"),
        message: err?.error || err?.message || t("project.members_import.toast.import_failed.message"),
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
          <SummaryView summary={summary} onClose={handleClose} />
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
