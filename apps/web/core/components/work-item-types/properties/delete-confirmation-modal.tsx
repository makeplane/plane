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
import { AlertTriangle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";

type TProps = {
  isOpen: boolean;
  isDisabledAlready: boolean;
  onClose: () => void;
  onDisable: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export const DeleteConfirmationModal = observer(function DeleteConfirmationModal(props: TProps) {
  const { isOpen, isDisabledAlready, onClose, onDisable, onDelete } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleDisable = async () => {
    setIsSubmitting(true);
    await onDisable().finally(() => {
      onClose();
      setIsSubmitting(false);
    });
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    await onDelete().finally(() => {
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
        <span
          className={cn(
            "flex-shrink-0 grid place-items-center rounded-full size-10 bg-danger-subtle text-danger-primary"
          )}
        >
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <div className="py-1 text-center sm:text-left">
          <h5 className="text-h5-medium">{t("work_item_types.settings.properties.delete_confirmation.title")}</h5>
          <div className="py-1 pb-4 text-center sm:text-left text-body-sm-regular text-secondary">
            <p>{t("work_item_types.settings.properties.delete_confirmation.description")}</p>
            {!isDisabledAlready && (
              <p>{t("work_item_types.settings.properties.delete_confirmation.secondary_description")}</p>
            )}
          </div>
        </div>
      </div>
      <div className="px-1 pt-4 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 border-t-[0.5px] border-subtle-1">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 items-center sm:justify-end">
          {!isDisabledAlready && (
            <Button variant="secondary" onClick={handleDisable} className="w-full" disabled={isSubmitting}>
              {t("work_item_types.settings.properties.delete_confirmation.secondary_button")}
            </Button>
          )}
          <Button
            variant="error-fill"
            tabIndex={1}
            onClick={handleDelete}
            className="w-full focus:text-on-color"
            disabled={isSubmitting}
          >
            {t("work_item_types.settings.properties.delete_confirmation.primary_button", {
              action: isDisabledAlready ? t("common.yes") : t("common.no"),
            })}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
