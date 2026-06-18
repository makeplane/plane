/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// ui
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ECustomFieldEntityType, TCustomField } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// hooks
import { useCustomField } from "@/hooks/store/use-custom-field";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  entityType: ECustomFieldEntityType;
  field: TCustomField | null;
};

export function DeleteFieldModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, entityType, field } = props;
  // states
  const [isDeleting, setIsDeleting] = useState(false);
  // store hooks
  const { removeCustomField } = useCustomField();
  const { t } = useTranslation();

  const handleDelete = async () => {
    if (!field?.id) return;
    setIsDeleting(true);
    try {
      await removeCustomField(workspaceSlug, entityType, field.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.custom_fields.toasts.removed.title"),
        message: t("workspace_settings.settings.custom_fields.toasts.removed.message"),
      });
      onClose();
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.custom_fields.toasts.error.title"),
        message: t("workspace_settings.settings.custom_fields.toasts.not_removed.message"),
      });
    }
    setIsDeleting(false);
  };

  return (
    <AlertModalCore
      handleClose={onClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title={t("workspace_settings.settings.custom_fields.delete.title")}
      content={t("workspace_settings.settings.custom_fields.delete.description", { name: field?.display_name ?? "" })}
    />
  );
}
