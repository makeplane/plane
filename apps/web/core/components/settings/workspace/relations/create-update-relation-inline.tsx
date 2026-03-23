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
import { Info } from "lucide-react";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkItemRelationDefinition, TWorkItemRelationDefinitionPayload } from "@plane/types";
import { Tooltip } from "@plane/ui";
// hooks
import { useRelationDefinition } from "@/hooks/store/use-relation-definition";

type Props = {
  workspaceSlug: string;
  isUpdating: boolean;
  definitionToUpdate?: IWorkItemRelationDefinition;
  onClose: () => void;
};

type TFormData = {
  name: string;
  inward: string;
  outward: string;
};

const defaultValues: TFormData = {
  name: "",
  inward: "",
  outward: "",
};

const TOOLTIP_CLASS = "!max-w-sm !rounded-lg !border !border-subtle !p-4";

export const CreateUpdateRelationInline = observer(function CreateUpdateRelationInline(props: Props) {
  const { workspaceSlug, isUpdating, definitionToUpdate, onClose } = props;
  // store hooks
  const { createRelationDefinition, updateRelationDefinition } = useRelationDefinition();
  const { t } = useTranslation();
  // form
  const {
    handleSubmit,
    control,
    reset,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<TFormData>({ defaultValues });

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const handleCreate: SubmitHandler<TFormData> = async (formData) => {
    if (isSubmitting) return;

    const payload: TWorkItemRelationDefinitionPayload = {
      name: formData.name,
      inward: formData.inward,
      outward: formData.outward,
    };

    await createRelationDefinition(workspaceSlug, payload)
      .then(() => {
        handleClose();
      })
      .catch((error) => {
        setToast({
          title: "Error!",
          type: TOAST_TYPE.ERROR,
          message:
            error?.name && Array.isArray(error.name)
              ? "A relation with this name already exists"
              : (error?.detail ?? error?.error ?? t("common.something_went_wrong")),
        });
      });
  };

  const handleUpdate: SubmitHandler<TFormData> = async (formData) => {
    if (!definitionToUpdate?.id || isSubmitting) return;

    const payload: TWorkItemRelationDefinitionPayload = {
      name: formData.name,
      inward: formData.inward,
      outward: formData.outward,
    };

    await updateRelationDefinition(workspaceSlug, definitionToUpdate.id, payload)
      .then(() => {
        handleClose();
      })
      .catch((error) => {
        setToast({
          title: "Error!",
          type: TOAST_TYPE.ERROR,
          message:
            error?.name && Array.isArray(error.name)
              ? "A relation with this name already exists"
              : (error?.detail ?? error?.error ?? "Failed to update relation"),
        });
      });
  };

  const onSubmit = (formData: TFormData) => {
    if (isUpdating) {
      handleUpdate(formData);
    } else {
      handleCreate(formData);
    }
  };

  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  useEffect(() => {
    if (!definitionToUpdate) return;
    setValue("name", definitionToUpdate.name);
    setValue("inward", definitionToUpdate.inward);
    setValue("outward", definitionToUpdate.outward);
  }, [definitionToUpdate, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="overflow-clip rounded-lg border border-subtle">
      {/* Fields section */}
      <div className="flex flex-col gap-6 border-b border-subtle bg-layer-2 p-4">
        {/* Title */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-body-xs-medium text-primary">Title</span>
          </div>
          <div className="w-72.5 shrink-0">
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Title is required",
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  placeholder="e.g. Finish-to-Start"
                  inputSize="sm"
                  className="w-full"
                />
              )}
            />
            {errors.name?.message && (
              <p className="mt-1 text-caption-md-regular text-danger-primary">{errors.name.message}</p>
            )}
          </div>
        </div>

        {/* Inward name */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-body-xs-medium text-primary">Inward name</span>
              <Tooltip
                tooltipContent={
                  <div className="flex flex-col gap-1.5">
                    <p className="text-body-md-medium text-primary">Inward relationship</p>
                    <p className="text-body-xs-regular text-secondary">
                      This defines how the other task relates back to this task.
                      <br />
                      It appears on the linked task&apos;s detail page.
                    </p>
                    <p className="text-body-xs-regular text-secondary">
                      Example: If you write <span className="text-danger-primary">&quot;is blocked by&quot;</span>, it
                      will read:
                      <br />
                      Task B <span className="text-danger-primary">is blocked by</span> Task A.
                    </p>
                  </div>
                }
                position="right"
                className={TOOLTIP_CLASS}
              >
                <Info className="size-3.5 text-tertiary cursor-help" />
              </Tooltip>
            </div>
            <p className="text-caption-md-regular text-tertiary">
              The relation as seen from the work item you&apos;re adding it to.
            </p>
          </div>
          <div className="w-72.5 shrink-0">
            <Controller
              control={control}
              name="inward"
              rules={{
                required: "Inward name is required",
                maxLength: {
                  value: 255,
                  message: "Inward name should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.inward)}
                  placeholder="e.g. blocking"
                  inputSize="sm"
                  className="w-full"
                />
              )}
            />
            {errors.inward?.message && (
              <p className="mt-1 text-caption-md-regular text-danger-primary">{errors.inward.message}</p>
            )}
          </div>
        </div>

        {/* Outward name */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-body-xs-medium text-primary">Outward name</span>
              <Tooltip
                tooltipContent={
                  <div className="flex flex-col gap-1.5">
                    <p className="text-body-md-medium text-primary">Outward relationship</p>
                    <p className="text-body-xs-regular text-secondary">
                      This defines how this task relates to the other task.
                      <br />
                      It appears on this task&apos;s detail page.
                    </p>
                    <p className="text-body-xs-regular text-secondary">
                      Example: If you write <span className="text-danger-primary">&quot;blocks&quot;</span>, it will
                      read:
                      <br />
                      Task A <span className="text-danger-primary">blocks</span> Task B.
                    </p>
                  </div>
                }
                position="right"
                className={TOOLTIP_CLASS}
              >
                <Info className="size-3.5 text-tertiary cursor-help" />
              </Tooltip>
            </div>
            <p className="text-caption-md-regular text-tertiary">
              The relation as seen from the work item you&apos;re linking.
            </p>
          </div>
          <div className="w-72.5 shrink-0">
            <Controller
              control={control}
              name="outward"
              rules={{
                required: "Outward name is required",
                maxLength: {
                  value: 255,
                  message: "Outward name should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.outward)}
                  placeholder="e.g. blocked by"
                  inputSize="sm"
                  className="w-full"
                />
              )}
            />
            {errors.outward?.message && (
              <p className="mt-1 text-caption-md-regular text-danger-primary">{errors.outward.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions section */}
      <div className="flex items-center justify-end gap-3 bg-layer-2 px-4 py-3">
        <Button variant="secondary" size="lg" onClick={handleClose} type="button">
          {t("cancel")}
        </Button>
        <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
});
