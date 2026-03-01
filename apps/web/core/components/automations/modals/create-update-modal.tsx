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
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TAutomation } from "@plane/types";
import { EAutomationScope } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  data?: Partial<TAutomation>;
  isOpen: boolean;
  onClose: () => void;
};

const defaultValues: Partial<TAutomation> = {
  name: "",
  description: "",
  scope: EAutomationScope.WORK_ITEM,
};

export const CreateUpdateAutomationModal = observer(function CreateUpdateAutomationModal(props: Props) {
  const { data, isOpen, onClose } = props;
  // app router
  const router = useAppRouter();
  const { workspaceSlug: workspaceSlugParam, projectId: projectIdParam } = useParams();
  const workspaceSlug = workspaceSlugParam?.toString();
  const projectId = projectIdParam?.toString();
  // store hooks
  const {
    getAutomationById,
    projectAutomations: { canCurrentUserCreateAutomation, createAutomation },
  } = useAutomations();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<TAutomation>({
    defaultValues,
  });
  // derived value
  const isEditing = !!data?.id;
  // translation
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
  };

  const handleCreate = async (payload: Partial<TAutomation>) => {
    if (!canCurrentUserCreateAutomation) return;
    try {
      const res = await createAutomation(workspaceSlug, projectId, payload);
      if (res?.redirectionLink) {
        router.push(res?.redirectionLink);
      }
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("automations.toasts.create.error.title"),
        message: error?.error || t("automations.toasts.create.error.message"),
      });
    }
  };

  const handleUpdate = async (payload: Partial<TAutomation>) => {
    if (!isEditing || !data?.id) return;
    try {
      const automation = getAutomationById(data.id);
      await automation?.update(payload);
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("automations.toasts.update.error.title"),
        message: error?.error || t("automations.toasts.update.error.message"),
      });
    }
  };

  const handleFormSubmit = async (payload: Partial<TAutomation>) => {
    if (isEditing) {
      await handleUpdate(payload);
    } else {
      await handleCreate(payload);
    }
    handleClose();
  };

  // update form values from pre-defined data
  useEffect(() => {
    if (isOpen) {
      reset({
        ...defaultValues,
        ...data,
      });
    }
  }, [data, isOpen, reset]);

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-18 font-medium text-secondary">
            {isEditing ? t("automations.create_modal.heading.update") : t("automations.create_modal.heading.create")}
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Controller
                name="name"
                control={control}
                rules={{
                  required: t("automations.create_modal.title.required_error"),
                }}
                render={({ field: { value, onChange } }) => (
                  <Input
                    type="text"
                    placeholder={t("automations.create_modal.title.placeholder")}
                    className="w-full px-2 py-1.5 text-14"
                    value={value}
                    onChange={onChange}
                    hasError={Boolean(errors?.name)}
                    autoFocus
                    maxLength={255}
                  />
                )}
              />
              <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
            </div>
            <div>
              <Controller
                name="description"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <TextArea
                    id="description"
                    name="description"
                    placeholder={t("automations.create_modal.description.placeholder")}
                    className="w-full text-14 resize-none min-h-24"
                    hasError={Boolean(errors?.description)}
                    value={value ?? ""}
                    onChange={onChange}
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle-1">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
            {isEditing
              ? isSubmitting
                ? t("common.updating")
                : t("automations.create_modal.submit_button.update")
              : isSubmitting
                ? t("common.creating")
                : t("automations.create_modal.submit_button.create")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
