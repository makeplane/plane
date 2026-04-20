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
import { useNavigate } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { CloseIcon } from "@plane/propel/icons";
import { Input } from "@plane/propel/input";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { PermissionNamespace } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, TextArea } from "@plane/ui";
// hooks
import { useRoleManagement } from "@/hooks/store/use-role-management";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  namespace: PermissionNamespace;
  workspaceSlug: string;
};

type CreateRoleFormData = {
  name: string;
  description: string;
};

export const CreateRoleModal = observer(function CreateRoleModal(props: Props) {
  const { isOpen, onClose, namespace, workspaceSlug } = props;
  // router
  const navigate = useNavigate();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { createRole } = useRoleManagement();
  // form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<CreateRoleFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const currentName = watch("name");

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset({ name: "", description: "" });
    }
  }, [isOpen, reset]);

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async (formData: CreateRoleFormData) => {
    try {
      const createdRole = await createRole({
        workspaceSlug,
        data: {
          name: formData.name,
          description: formData.description,
          namespace,
          permission_scheme_ids: [],
        },
      });
      handleClose();
      void navigate(`roles/${createdRole.slug}`, { relative: "path" });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles_and_schemes.create_role.error_toast_description"),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <h4 className="text-h4-medium text-secondary">
          {t("workspace_settings.settings.roles_and_schemes.create_role.modal_title")}
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
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <label htmlFor="description" className="text-body-sm-medium text-secondary">
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
                  className="text-body-xs-regular min-h-8 resize-none"
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
          <Button type="submit" disabled={!currentName.trim() || isSubmitting} loading={isSubmitting}>
            {t("workspace_settings.settings.roles_and_schemes.create_role.create_button")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
