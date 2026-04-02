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
import { LayersIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

type SetDefaultConfirmationModalProps = {
  isOpen: boolean;
  typeName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export const SetDefaultConfirmationModal = observer(function SetDefaultConfirmationModal(
  props: SetDefaultConfirmationModalProps
) {
  const { isOpen, typeName, onClose, onConfirm } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm().finally(() => {
      onClose();
      setIsSubmitting(false);
    });
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
      className="py-5 px-6"
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <span className="shrink-0 grid place-items-center rounded-full size-10 bg-accent-subtle text-accent-primary">
          <LayersIcon className="size-6" />
        </span>
        <div className="py-1 text-center sm:text-left">
          <h5 className="text-h5-medium">{t("work_item_types.settings.set_default_confirmation.title")}</h5>
          <div className="py-1 pb-4 text-center sm:text-left text-body-sm-regular text-secondary">
            <p>{t("work_item_types.settings.set_default_confirmation.description", { name: typeName })}</p>
          </div>
        </div>
      </div>
      <div className="px-1 pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t-[0.5px] border-subtle-1">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={isSubmitting}>
          {isSubmitting
            ? t("common.confirming")
            : t("work_item_types.settings.set_default_confirmation.confirm_button")}
        </Button>
      </div>
    </ModalCore>
  );
});
