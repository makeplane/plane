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
import { useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TWorkItemType } from "@plane/types";
import { EModalPosition, EModalWidth, getRandomIconName, ModalCore } from "@plane/ui";
import { getRandomBackgroundColor, isObject } from "@plane/utils";
// plane web imports
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// local imports
import { CreateOrUpdateWorkItemTypeForm } from "./form";
import type { WorkItemTypeCreateUpdateActions, WorkItemTypeCreateUpdatePermissions } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workItemTypeId?: string;
  workItemTypeData?: Partial<TWorkItemType>;
  actions: WorkItemTypeCreateUpdateActions;
  permissions?: WorkItemTypeCreateUpdatePermissions;
};

const defaultFormData: Partial<TWorkItemType> = {
  id: undefined,
  name: "",
  description: "",
  is_active: false,
};

export const CreateOrUpdateWorkItemTypeModal = observer(function CreateOrUpdateWorkItemTypeModal(props: Props) {
  const { isOpen, onClose, workItemTypeId, workItemTypeData, actions, permissions } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<TWorkItemType> | undefined>(undefined);
  // params
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { featuresByWorkspaceSlug } = useWorkspaceFeatures();
  // derived values
  const defaultLevel = workspaceSlug ? (featuresByWorkspaceSlug(workspaceSlug)?.work_item_type_default_level ?? 0) : 0;
  const mode = workItemTypeId ? "update" : "create";

  useEffect(() => {
    if (isOpen) {
      if (workItemTypeData) {
        setFormData(workItemTypeData);
      } else {
        setFormData({
          ...defaultFormData,
          level: defaultLevel,
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
  }, [workItemTypeData, isOpen, defaultLevel]);

  // handlers
  const handleFormDataChange = <T extends keyof TWorkItemType>(key: T, value: TWorkItemType[T]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleModalClearAndClose = () => {
    setFormData(defaultFormData);
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData) return;

    try {
      setIsSubmitting(true);
      if (mode === "update" && workItemTypeId) {
        await actions.update(workItemTypeId, formData);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("work_item_types.update.toast.success.title"),
          message: t("work_item_types.update.toast.success.message", { name: formData?.name }),
        });
      } else {
        await actions.create(formData);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("work_item_types.create.toast.success.title"),
          message: t("work_item_types.create.toast.success.message"),
        });
      }
      handleModalClearAndClose();
    } catch (error: any) {
      const toastKey = mode === "update" ? "work_item_types.update" : "work_item_types.create";
      if (mode === "update" && isObject(error) && "level" in error) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("work_item_type_hierarchy.add_level_modal.invalid_level_toast.title"),
          message: t("work_item_type_hierarchy.add_level_modal.invalid_level_toast.message", {
            type_name: formData?.name,
            level: formData?.level,
          }),
        });
      } else {
        if (error?.code === "ISSUE_TYPE_ALREADY_EXIST") {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t(`${toastKey}.toast.error.title`),
            message: t(`${toastKey}.toast.error.message.conflict`, { name: formData?.name }),
          });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t(`${toastKey}.toast.error.title`),
            message: t(`${toastKey}.toast.error.message.default`),
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleModalClearAndClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <h4 className="text-h4-medium text-secondary">
          {mode === "update" ? t("work_item_types.update.title") : t("work_item_types.create.title")}
        </h4>
        <IconButton icon={CloseIcon} variant="ghost" onClick={handleModalClearAndClose} />
      </div>
      {/* Body */}
      <CreateOrUpdateWorkItemTypeForm
        formData={formData ?? defaultFormData}
        isSubmitting={isSubmitting}
        handleFormDataChange={handleFormDataChange}
        handleModalClose={handleModalClearAndClose}
        handleFormSubmit={handleSubmit}
        permissions={permissions}
      />
    </ModalCore>
  );
});
