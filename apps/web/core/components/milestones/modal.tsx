/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TMilestone, TMilestoneFormData } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
// hooks
import { useMilestone } from "@/hooks/store/use-milestone";
import useKeypress from "@/hooks/use-keypress";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  data?: TMilestone;
};

const defaultValues: TMilestoneFormData = {
  name: "",
  description: "",
  target_date: null,
};

export const CreateUpdateMilestoneModal = observer(function CreateUpdateMilestoneModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, projectId, data } = props;
  // store hooks
  const { createMilestone, updateMilestone } = useMilestone();
  // plane hooks
  const { t } = useTranslation();
  // form info
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<TMilestoneFormData>({ defaultValues });

  useEffect(() => {
    if (isOpen)
      reset({
        name: data?.name ?? "",
        description: data?.description ?? "",
        target_date: data?.target_date ?? null,
      });
  }, [data, isOpen, reset]);

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  useKeypress("Escape", () => {
    if (isOpen) handleClose();
  });

  const handleFormSubmit = async (formData: TMilestoneFormData) => {
    const payload: TMilestoneFormData = {
      name: formData.name,
      description: formData.description ?? "",
      target_date: formData.target_date ?? null,
    };
    try {
      if (data) await updateMilestone(workspaceSlug, projectId, data.id, payload);
      else await createMilestone(workspaceSlug, projectId, payload);
      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: data ? "Milestone updated successfully." : "Milestone created successfully.",
      });
    } catch (error) {
      const err = error as { detail?: string; error?: string; name?: string[] };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message:
          err?.detail ??
          err?.error ??
          (data
            ? "Milestone could not be updated. Please try again."
            : "Milestone could not be created. Please try again."),
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-18 font-medium text-secondary">
            {data ? t("milestone_update") : t("milestone_new")}
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Controller
                control={control}
                name="name"
                rules={{
                  required: t("title_is_required"),
                  maxLength: {
                    value: 255,
                    message: t("title_should_be_less_than_255_characters"),
                  },
                }}
                render={({ field: { value, onChange } }) => (
                  <Input
                    id="milestone-name"
                    name="name"
                    type="text"
                    value={value}
                    onChange={onChange}
                    hasError={Boolean(errors?.name)}
                    placeholder={t("title")}
                    className="w-full text-14"
                  />
                )}
              />
              <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
            </div>
            <div>
              <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange } }) => (
                  <TextArea
                    id="milestone-description"
                    name="description"
                    value={value}
                    onChange={onChange}
                    placeholder={t("description")}
                    className="min-h-24 w-full resize-none text-14"
                    hasError={Boolean(errors?.description)}
                  />
                )}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Controller
                control={control}
                name="target_date"
                render={({ field: { value, onChange } }) => (
                  <div className="h-7">
                    <DateDropdown
                      value={value ?? null}
                      onChange={(date) => onChange(date ? renderFormattedPayloadDate(date) : null)}
                      buttonVariant="border-with-text"
                      placeholder={t("target_date")}
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
            {data
              ? isSubmitting
                ? t("updating")
                : t("common.update")
              : isSubmitting
                ? t("creating")
                : t("common.create")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
