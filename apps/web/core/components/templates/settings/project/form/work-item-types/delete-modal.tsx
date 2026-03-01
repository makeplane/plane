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
import type { IIssueType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// helpers

type TProps = {
  issueTypeId: string | null;
  isModalOpen: boolean;
  handleModalClose: () => void;
  handleEnableDisable: (issueTypeId: string) => Promise<void>;
  handleDelete: (issueTypeId: string) => Promise<void>;
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
};

export const DeleteWorkItemTypeModal = observer(function DeleteWorkItemTypeModal(props: TProps) {
  const { issueTypeId, isModalOpen, handleModalClose, handleEnableDisable, handleDelete, getWorkItemTypeById } = props;
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  // plane hooks
  const { t } = useTranslation();
  const issueTypeDetail = issueTypeId ? getWorkItemTypeById(issueTypeId) : null;
  const isDefault = issueTypeDetail?.is_default;
  const isTypeDisabled = !issueTypeDetail?.is_active;

  const onDelete = async () => {
    if (!issueTypeId) return;
    setIsDeleting(true);
    await handleDelete(issueTypeId);
    handleModalClose();
    setIsDeleting(false);
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
          <h3 className="text-h6-medium">{t("work_item_types.settings.item_delete_confirmation.title")}</h3>
          <div className="py-1 pb-4 text-center sm:text-left text-body-xs-regular text-secondary">
            <p>{t("work_item_types.settings.item_delete_confirmation.description")}</p>
            {!isDefault && !isTypeDisabled && (
              <p className="text-caption-sm-regular text-secondary">
                {t("work_item_types.settings.item_delete_confirmation.can_disable_warning")}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="px-1 pt-4 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 border-t border-subtle">
        <Button variant="secondary" size="lg" onClick={handleModalClose} disabled={isDeleting}>
          {t("common.cancel")}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 items-center sm:justify-end">
          {!isDefault && !isTypeDisabled && (
            <Button
              variant="secondary"
              size="lg"
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
            size="lg"
            tabIndex={1}
            onClick={async () => {
              if (!issueTypeId) return;
              await onDelete();
            }}
            className="w-full focus:!text-on-color"
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
