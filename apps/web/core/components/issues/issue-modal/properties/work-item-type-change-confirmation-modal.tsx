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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { AlertModalCore } from "@plane/ui";

type TWorkItemTypeChangeConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const WorkItemTypeChangeConfirmationModal = observer(function WorkItemTypeChangeConfirmationModal(
  props: TWorkItemTypeChangeConfirmationModalProps
) {
  const { isOpen, onClose, onConfirm } = props;
  // hooks
  const { t } = useTranslation();

  const handleSubmit = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertModalCore
      handleClose={onClose}
      handleSubmit={handleSubmit}
      isSubmitting={false}
      isOpen={isOpen}
      title={t("work_item_types.change_confirmation.title")}
      content={t("work_item_types.change_confirmation.description")}
      primaryButtonText={{
        loading: t("work_item_types.change_confirmation.button.loading"),
        default: t("work_item_types.change_confirmation.button.default"),
      }}
    />
  );
});
