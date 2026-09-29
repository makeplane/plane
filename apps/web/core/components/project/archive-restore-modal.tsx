/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;

  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  archive: boolean;
};

export function ArchiveRestoreProjectModal(props: Props) {
  const { workspaceSlug, projectId, isOpen, onClose, archive } = props;
  // translation
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  // states
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { getProjectById, archiveProject, restoreProject } = useProject();

  const projectDetails = getProjectById(projectId);
  if (!projectDetails) return null;

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  const handleArchiveProject = async () => {
    setIsLoading(true);
    await archiveProject(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_components.archive_restore_modal.archive_success_title"),
          message: t("project_components.archive_restore_modal.archive_success_message", { name: projectDetails.name }),
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/`);
        return;
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("project_components.archive_restore_modal.archive_error"),
        })
      )
      .finally(() => setIsLoading(false));
  };

  const handleRestoreProject = async () => {
    setIsLoading(true);
    await restoreProject(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_components.archive_restore_modal.restore_success_title"),
          message: t("project_components.archive_restore_modal.restore_success_message", { name: projectDetails.name }),
        });
        onClose();
        router.push(`/${workspaceSlug}/projects/`);
        return;
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("project_components.archive_restore_modal.restore_error"),
        })
      )
      .finally(() => setIsLoading(false));
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="px-5 py-4">
        <h3 className="text-18 font-medium 2xl:text-20">
          {archive
            ? t("project_components.archive_restore_modal.archive_heading", { name: projectDetails.name })
            : t("project_components.archive_restore_modal.restore_heading", { name: projectDetails.name })}
        </h3>
        <p className="mt-3 text-13 text-secondary">
          {archive
            ? t("project_components.archive_restore_modal.archive_description")
            : t("project_components.archive_restore_modal.restore_description")}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            size="lg"
            tabIndex={1}
            onClick={archive ? handleArchiveProject : handleRestoreProject}
            loading={isLoading}
          >
            {archive
              ? isLoading
                ? t("common.archiving")
                : t("archive")
              : isLoading
                ? t("project_components.shared.restoring")
                : t("restore")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
