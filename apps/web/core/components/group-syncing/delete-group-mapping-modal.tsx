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

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
import type { GroupMap } from "@plane/types";

type DeleteMappingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  data: GroupMap | null;
  onDelete: (workspaceSlug: string, mappingId: string) => Promise<void>;
  workspaceSlug: string;
};

export const DeleteGroupMappingModal = observer(function DeleteGroupMappingModal({
  isOpen,
  onClose,
  data,
  onDelete,
  workspaceSlug,
}: DeleteMappingModalProps) {
  const { t } = useTranslation();
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data) return;

    setIsDeleteLoading(true);

    await onDelete(workspaceSlug, data.id)
      .then(() => handleClose())
      .catch((err: unknown) => {
        setIsDeleteLoading(false);
        const errorMessage =
          err && typeof err === "object" && "error" in err && typeof err.error === "string"
            ? err.error
            : t("toast.error");
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: errorMessage,
        });
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={() => void handleDeletion()}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title={t("workspace_settings.settings.group_syncing.delete_modal.title")}
      content={<>{t("workspace_settings.settings.group_syncing.delete_modal.content")}</>}
    />
  );
});
