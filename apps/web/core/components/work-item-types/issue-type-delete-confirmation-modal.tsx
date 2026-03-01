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

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TProps = {
  issueTypeId: string | null;
  isModalOpen: boolean;
  handleModalClose: () => void;
  handleEnableDisable: (issueTypeId: string) => Promise<void>;
};

export const IssueTypeDeleteConfirmationModal = observer(function IssueTypeDeleteConfirmationModal(props: TProps) {
  const { issueTypeId, isModalOpen, handleModalClose, handleEnableDisable } = props;
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  // plane hooks
  const { t } = useTranslation();
  const { deleteType, getIssueTypeById } = useIssueTypes();
  const issueTypeDetail = issueTypeId ? getIssueTypeById(issueTypeId) : null;
  const isDefault = issueTypeDetail?.is_default;
  const isTypeDisabled = !issueTypeDetail?.is_active;

  const handleDelete = async () => {
    if (!issueTypeId) return;
    setIsDeleting(true);
    await deleteType(issueTypeId)
      .then(() => {
        handleModalClose();
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.settings.item_delete_confirmation.toast.error.title"),
          message: error?.error ?? t("work_item_types.settings.item_delete_confirmation.toast.error.message"),
        });
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <ModalCore
      isOpen={isModalOpen}
      handleClose={handleModalClose}
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
          <h5 className="text-h5-medium">{t("work_item_types.settings.item_delete_confirmation.title")}</h5>
          <div className="py-1 pb-4 text-center sm:text-left text-body-sm-regular text-secondary">
            <p>{t("work_item_types.settings.item_delete_confirmation.description")}</p>
            {!isDefault && !isTypeDisabled && (
              <p className="text-caption-md-regular text-secondary">
                {t("work_item_types.settings.item_delete_confirmation.can_disable_warning")}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="px-1 pt-4 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 border-t-[0.5px] border-subtle-1">
        <Button variant="secondary" onClick={handleModalClose} disabled={isDeleting}>
          {t("common.cancel")}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 items-center sm:justify-end">
          {!isDefault && !isTypeDisabled && (
            <Button
              variant="secondary"
              onClick={async () => {
                if (!issueTypeId) return;
                await handleEnableDisable(issueTypeId);
                handleModalClose();
              }}
              disabled={isDeleting}
            >
              {t("work_item_types.settings.properties.delete_confirmation.secondary_button")}
            </Button>
          )}
          <Button
            variant="error-fill"
            tabIndex={1}
            onClick={handleDelete}
            className="w-full focus:text-on-color"
            disabled={isDeleting}
          >
            {t("work_item_types.settings.properties.delete_confirmation.primary_button", {
              action: isDefault || isTypeDisabled ? t("common.yes") : t("common.no"),
            })}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
