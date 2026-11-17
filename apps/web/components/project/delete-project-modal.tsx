/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
// Plane imports
import { TypeToConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { IProject } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";

type DeleteProjectModal = {
  isOpen: boolean;
  project: IProject;
  onClose: () => void;
};

export function DeleteProjectModal(props: DeleteProjectModal) {
  const { isOpen, project, onClose } = props;
  // store hooks
  const { deleteProject } = useProject();
  // plane hooks
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();

  const onSubmit = async () => {
    if (!workspaceSlug) return;

    try {
      await deleteProject(workspaceSlug.toString(), project.id);
      if (projectId && projectId.toString() === project.id) router.push(`/${workspaceSlug}/projects`);
      onClose();
      setToast({
        type: "success",
        title: t("toast.success"),
        message: t("project_settings.general.delete_project.success_message"),
      });
    } catch (_error) {
      setToast({
        type: "error",
        title: t("toast.error"),
        message: t("something_went_wrong_please_try_again"),
      });
    }
  };

  return (
    <TypeToConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onSubmit}
      title={t("project_settings.general.delete_project.title")}
      description={t("project_settings.general.delete_project.confirm_description", {
        projectName: project?.name ?? "",
      })}
      fields={[
        {
          name: "projectName",
          label: t("project_settings.general.confirm_project_name_label"),
          expectedValue: project?.name ?? "",
        },
      ]}
      confirmLabel={t("project_settings.general.delete_project.title")}
      loadingLabel={t("deleting")}
    />
  );
}
