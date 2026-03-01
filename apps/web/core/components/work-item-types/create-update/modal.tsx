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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TIssueType } from "@plane/types";
import { EModalPosition, EModalWidth, getRandomIconName, ModalCore } from "@plane/ui";
import { getRandomBackgroundColor } from "@plane/utils";
// plane web imports
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
// local imports
import { CreateOrUpdateIssueTypeForm } from "./form";

type Props = {
  issueTypeId: string | null;
  isModalOpen: boolean;
  handleModalClose: () => void;
};

const defaultIssueTypeData: Partial<TIssueType> = {
  id: undefined,
  name: "",
  description: "",
};

export const CreateOrUpdateIssueTypeModal = observer(function CreateOrUpdateIssueTypeModal(props: Props) {
  const { issueTypeId, isModalOpen, handleModalClose } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [issueTypeFormData, setIssueTypeFormData] = useState<Partial<TIssueType> | undefined>(undefined);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { createType } = useIssueTypes();
  const issueType = useIssueType(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;

  useEffect(() => {
    if (isModalOpen) {
      if (issueTypeDetail) {
        setIssueTypeFormData(issueTypeDetail);
      } else {
        setIssueTypeFormData({
          ...defaultIssueTypeData,
          logo_props: {
            in_use: "icon",
            icon: {
              name: getRandomIconName(),
              background_color: getRandomBackgroundColor(),
            },
          },
        });
      }
    }
  }, [issueTypeDetail, isModalOpen]);

  // handlers
  const handleFormDataChange = <T extends keyof TIssueType>(key: T, value: TIssueType[T]) =>
    setIssueTypeFormData((prev) => ({ ...prev, [key]: value }));

  const handleModalClearAndClose = () => {
    setIssueTypeFormData(defaultIssueTypeData);
    handleModalClose();
  };

  const handleCreateIssueType = async () => {
    if (!issueTypeFormData) return;

    try {
      setIsSubmitting(true);
      await createType(issueTypeFormData);
      handleModalClearAndClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("work_item_types.create.toast.success.title"),
        message: t("work_item_types.create.toast.success.message"),
      });
      setIsSubmitting(false);
    } catch (error: any) {
      if (error?.code === "ISSUE_TYPE_ALREADY_EXIST") {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.create.toast.error.title"),
          message: t("work_item_types.create.toast.error.message.conflict", { name: issueTypeFormData?.name }),
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.create.toast.error.title"),
          message: t("work_item_types.create.toast.error.message.default"),
        });
      }
      setIsSubmitting(false);
    }
  };

  const handleUpdateIssueType = async () => {
    if (!issueTypeFormData) return;

    try {
      setIsSubmitting(true);
      await issueType?.updateType(issueTypeFormData);
      handleModalClearAndClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("work_item_types.update.toast.success.title"),
        message: t("work_item_types.update.toast.success.message", { name: issueTypeFormData?.name }),
      });
      setIsSubmitting(false);
    } catch (error: any) {
      if (error.code === "ISSUE_TYPE_ALREADY_EXIST") {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.update.toast.error.title"),
          message: t("work_item_types.update.toast.error.message.conflict", { name: issueTypeFormData?.name }),
        });
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_types.update.toast.error.title"),
          message: t("work_item_types.update.toast.error.message.default"),
        });
      }
      setIsSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <ModalCore
      isOpen={isModalOpen}
      handleClose={handleModalClearAndClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
    >
      <CreateOrUpdateIssueTypeForm
        formData={issueTypeFormData ?? defaultIssueTypeData}
        isSubmitting={isSubmitting}
        handleFormDataChange={handleFormDataChange}
        handleModalClose={handleModalClearAndClose}
        handleFormSubmit={issueTypeId ? handleUpdateIssueType : handleCreateIssueType}
      />
    </ModalCore>
  );
});
