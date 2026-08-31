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
import type { IProjectCustomField } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useProjectCustomField } from "@/hooks/store/use-project-custom-field";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: IProjectCustomField | null;
};

export const DeleteProjectCustomFieldModal = observer(function DeleteProjectCustomFieldModal(props: Props) {
  const { isOpen, onClose, data } = props;
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();
  const { deleteCustomField } = useProjectCustomField();

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !projectId || !data) return;
    setIsDeleteLoading(true);
    await deleteCustomField(workspaceSlug.toString(), projectId.toString(), data.id)
      .then(() => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_custom_field.settings.toasts.delete.success.title"),
          message: t("project_custom_field.settings.toasts.delete.success.message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_custom_field.settings.toasts.delete.error.title"),
          message: t("project_custom_field.settings.toasts.delete.error.message"),
        });
      })
      .finally(() => {
        setIsDeleteLoading(false);
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title={t("project_custom_field.settings.delete_confirmation.title")}
      content={
        <>
          {t("project_custom_field.settings.delete_confirmation.description")}{" "}
          <span className="font-medium text-primary">{data?.name}</span>
        </>
      }
    />
  );
});
