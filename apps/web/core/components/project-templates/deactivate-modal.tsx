/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TProjectTemplate } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// components
import { ProjectService } from "@/services/project";

type TProjectTemplateDeactivateModal = {
  isOpen: boolean;
  onClose: () => void;
  template: TProjectTemplate | null;
};

const projectService = new ProjectService();

/**
 * Confirmation modal for deactivating a custom project template.
 * Mirrors `apps/web/core/components/project-states/state-delete-modal.tsx`:
 * local `isSubmitting`, .then(close+toast) .catch(toast) .finally(reset).
 *
 * Soft-deletes via DELETE /workspaces/<slug>/project-templates/<id>/ (204).
 * The list root revalidates the active + include-inactive SWR keys so the
 * row leaves the active list immediately. Built-in rows never reach this
 * modal (D-08); the backend enforces 400 on built-in destroy as defense
 * in depth.
 */
export const ProjectTemplateDeactivateModal = observer(function ProjectTemplateDeactivateModal(
  props: TProjectTemplateDeactivateModal
) {
  const { isOpen, onClose, template } = props;
  // translation
  const { t } = useTranslation();
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  // router
  const { workspaceSlug } = useParams();

  const handleClose = () => {
    onClose();
    setIsSubmitting(false);
  };

  const handleDeactivate = async () => {
    if (!workspaceSlug || !template) return;

    setIsSubmitting(true);

    await projectService
      .deactivateProjectTemplate(workspaceSlug.toString(), template.id)
      // eslint-disable-next-line promise/always-return
      .then(() => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.project_templates.toast.deactivated_title"),
          message: t("workspace_settings.settings.project_templates.toast.deactivated_message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.project_templates.toast.error_title"),
          message: t("workspace_settings.settings.project_templates.toast.deactivate_error"),
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeactivate}
      isSubmitting={isSubmitting}
      isOpen={isOpen}
      title={t("workspace_settings.settings.project_templates.deactivate.title")}
      content={
        <>
          {t("workspace_settings.settings.project_templates.deactivate.body_prefix")}{" "}
          <span className="font-medium text-primary">{template?.name}</span>
          {t("workspace_settings.settings.project_templates.deactivate.body_suffix")}
        </>
      }
      variant="danger"
      primaryButtonText={{
        loading: t("workspace_settings.settings.project_templates.deactivate.confirm_loading"),
        default: t("workspace_settings.settings.project_templates.deactivate.confirm"),
      }}
      secondaryButtonText={t("workspace_settings.settings.project_templates.deactivate.cancel")}
    />
  );
});
