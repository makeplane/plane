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
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ReleaseTag } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
// services
import releaseService from "@/services/release.service";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: ReleaseTag | null;
  workspaceSlug: string;
  onSuccess: () => void;
};

export const DeleteReleaseTagModal = observer(function DeleteReleaseTagModal(props: Props) {
  const { isOpen, onClose, data, workspaceSlug, onSuccess } = props;
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleting(false);
  };

  const handleDeletion = async () => {
    if (!data) return;
    setIsDeleting(true);
    await releaseService
      .destroyTag(workspaceSlug, data.id)
      .then(() => {
        onSuccess();
        handleClose();
      })
      .catch(() => {
        setIsDeleting(false);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("releases.settings.tags.toasts.delete.error"),
        });
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title={t("releases.settings.tags.delete_modal.title")}
      content={<>{t("releases.settings.tags.delete_modal.content", { tagVersion: data?.version })}</>}
    />
  );
});
