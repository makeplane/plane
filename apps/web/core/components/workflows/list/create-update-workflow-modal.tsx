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
import { useTranslation } from "@plane/i18n";
import type { TWorkflowCreatePayload, IWorkflow } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, TextArea } from "@plane/ui";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@plane/propel/input";
import { getChangedFields, TEXT_REGEX } from "@plane/utils";
import { Button } from "@plane/propel/button";
import { WorkItemTypeMultiSelect } from "../detail/type-selector";
import { useState } from "react";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";

const defaultValues: TWorkflowCreatePayload = {
  name: "",
  description: "",
  work_item_type_ids: [],
};

type Props = {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  workflow?: IWorkflow;
};

export const CreateUpdateWorkflowModal = observer(function CreateUpdateWorkflowModal(props: Props) {
  // props
  const { isOpen, onClose, workspaceSlug, projectId, workflow } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // hooks
  const { createWorkflow } = useWorkflows();
  const { t } = useTranslation();
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<TWorkflowCreatePayload>({
    defaultValues: {
      ...defaultValues,
      ...workflow?.asJSON,
    },
  });

  // handlers
  const handleClose = () => {
    onClose();
    reset(defaultValues);
  };

  const handleUpdate = async (data: TWorkflowCreatePayload) => {
    const payload = getChangedFields(
      data,
      dirtyFields as Partial<Record<Extract<keyof TWorkflowCreatePayload, string>, boolean | undefined>>
    );

    await workflow
      ?.update(workspaceSlug, projectId, payload)
      .then(() => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_settings.workflows.update.success.title"),
          message: t("project_settings.workflows.update.success.message"),
        });
        return;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_settings.workflows.update.error.title"),
          message: t("project_settings.workflows.update.error.message"),
        });
      });
  };

  const handleCreate = async (payload: TWorkflowCreatePayload) => {
    await createWorkflow(workspaceSlug, projectId, payload)
      .then(() => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_settings.workflows.create.success.title"),
          message: t("project_settings.workflows.create.success.message"),
        });
        return;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_settings.workflows.create.error.title"),
          message: t("project_settings.workflows.create.error.message"),
        });
      });
  };

  const onSubmit = async (payload: TWorkflowCreatePayload) => {
    setIsSubmitting(true);
    if (workflow) {
      await handleUpdate(payload);
    } else {
      await handleCreate(payload);
    }
    setIsSubmitting(false);
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XL} position={EModalPosition.TOP}>
      <div className="p-4">
        <div className="flex flex-col gap-3">
          <p>{t("project_settings.workflows.create.heading")}</p>
          <Controller
            control={control}
            name="name"
            rules={{
              maxLength: {
                value: 255,
                message: t("project_settings.workflows.create.name.validation.max_length"),
              },
              pattern: {
                value: TEXT_REGEX,
                message: t("project_settings.workflows.create.name.validation.invalid"),
              },
              required: t("project_settings.workflows.create.name.validation.required"),
            }}
            render={({ field }) => (
              <div className="flex flex-col gap-1">
                <Input {...field} placeholder={t("project_settings.workflows.create.name.placeholder")} />
                <span className="text-caption-xs-regular text-danger-primary">{errors?.name?.message}</span>
              </div>
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field: { value, onChange, name } }) => (
              <div className="flex flex-col gap-1">
                <TextArea
                  name={name}
                  value={value}
                  onChange={onChange}
                  placeholder={t("project_settings.workflows.create.description.placeholder")}
                  textAreaSize="md"
                  className="!h-auto text-body-xs-regular"
                  rows={5}
                />
                <span className="text-caption-xs-regular text-danger-primary">{errors?.description?.message}</span>
              </div>
            )}
          />
          {workflow && workflow.is_default ? null : (
            <Controller
              name="work_item_type_ids"
              control={control}
              render={({ field: { value, onChange } }) => (
                <WorkItemTypeMultiSelect
                  selectedTypeIds={value}
                  projectId={projectId}
                  handleChange={onChange}
                  workflowId={workflow?.id}
                />
              )}
            />
          )}
          <div className="border-t border-subtle" />
          <div className="flex items-center justify-end gap-2">
            <Button variant={"ghost"} onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
              {workflow ? t("save") : t("common.create")}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
});
