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

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";

// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TInitiativeLabel } from "@plane/types";
import { AlertModalCore } from "@plane/ui";

// local imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: TInitiativeLabel | null;
};

export const DeleteInitiativeLabelModal = observer(function DeleteInitiativeLabelModal(props: Props) {
  const { isOpen, onClose, data } = props;
  const { workspaceSlug } = useParams();

  // plane hooks
  const { t } = useTranslation();

  // store hooks
  const {
    initiative: { deleteInitiativeLabel },
  } = useInitiatives();

  // states
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!workspaceSlug || !data) return;

    setIsDeleteLoading(true);

    await deleteInitiativeLabel(workspaceSlug.toString(), data.id)
      .then(() => {
        handleClose();
      })
      .catch((err) => {
        setIsDeleteLoading(false);
        const error = err?.error || t("initiatives.initiative_labels.toast.delete_error");
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error,
        });
      });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading}
      isOpen={isOpen}
      title={t("initiatives.initiative_labels.delete_modal.title")}
      content={<>{t("initiatives.initiative_labels.delete_modal.content", { labelName: data?.name })}</>}
    />
  );
});
