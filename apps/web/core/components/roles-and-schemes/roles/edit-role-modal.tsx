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

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import { Input } from "@plane/propel/input";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore, TextArea } from "@plane/ui";
// hooks
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  roleId: string;
};

type EditRoleFormData = {
  name: string;
  description: string;
};

export const EditRoleModal = observer(function EditRoleModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, roleId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getRoleDetailsByRoleId, updateRole } = useRoleManagement();
  // derived
  const roleDetails = getRoleDetailsByRoleId(roleId);
  // form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting, isDirty },
  } = useForm<EditRoleFormData>({
    defaultValues: {
      name: roleDetails?.name ?? "",
      description: roleDetails?.description ?? "",
    },
  });

  const currentName = watch("name");

  // Reset form defaults when roleId changes or modal opens
  useEffect(() => {
    if (isOpen && roleDetails) {
      reset({
        name: roleDetails.name ?? "",
        description: roleDetails.description ?? "",
      });
    }
  }, [isOpen, roleId, roleDetails, reset]);

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (formData: EditRoleFormData) => {
    try {
      await updateRole({
        workspaceSlug,
        roleId,
        data: {
          name: formData.name,
          description: formData.description,
        },
      });
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles_and_schemes.edit_role.error_toast_description"),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <h4 className="text-h4-medium text-secondary">
          {t("workspace_settings.settings.roles_and_schemes.edit_role.modal_title")}
        </h4>
        <IconButton icon={CloseIcon} variant="ghost" onClick={handleClose} />
      </div>
      {/* Body */}
      <form
        onSubmit={(e) => {
          e.stopPropagation();
          void handleSubmit(onSubmit)(e);
        }}
      >
        <div className="px-5 py-4 space-y-4">
          <div className="flex flex-col gap-y-2">
            <label htmlFor="name" className="text-body-sm-medium text-secondary">
              {t("workspace_settings.settings.roles_and_schemes.create_role.role_title_label")}
              <span className="text-danger-secondary ml-1">*</span>
            </label>
            <Controller
              control={control}
              name="name"
              rules={{ required: true }}
              render={({ field: { value, onChange, onBlur, name, ref } }) => (
                <Input
                  ref={ref}
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder={t("workspace_settings.settings.roles_and_schemes.create_role.role_title_placeholder")}
                  autoFocus
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <label className="text-body-sm-medium text-secondary">
              {t("workspace_settings.settings.roles_and_schemes.create_role.description_label")}
            </label>
            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange, onBlur, name } }) => (
                <TextArea
                  name={name}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder={t("workspace_settings.settings.roles_and_schemes.create_role.description_placeholder")}
                  className="text-body-xs-regular"
                />
              )}
            />
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-subtle px-5 py-4">
          <Button variant="secondary" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={!currentName.trim() || !isDirty || isSubmitting} loading={isSubmitting}>
            {t("workspace_settings.settings.roles_and_schemes.edit_role.save_button")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
