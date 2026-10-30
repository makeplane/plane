/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane imports
import { TypeToConfirmDialog } from "@plane/blocks/dialog";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { IProject } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

export interface ILeaveProjectModal {
  project: IProject;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveProjectModal = observer(function LeaveProjectModal(props: ILeaveProjectModal) {
  const { project, isOpen, onClose } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { leaveProject } = useUserPermissions();

  const onSubmit = async () => {
    if (!workspaceSlug) return;

    try {
      await leaveProject(workspaceSlug.toString(), project.id);
      onClose();
      // Navigate only once the leave succeeded; a failure keeps the user here with the dialog open.
      router.push(`/${workspaceSlug}/projects`);
    } catch (_err) {
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
      title={t("leave_project")}
      description={t("project_settings.general.leave_project.confirm_description", {
        projectName: project?.name ?? "",
      })}
      fields={[
        {
          name: "projectName",
          label: t("project_settings.general.confirm_project_name_label"),
          expectedValue: project?.name ?? "",
        },
      ]}
      confirmLabel={t("leave_project")}
      loadingLabel={t("leaving")}
    />
  );
});
