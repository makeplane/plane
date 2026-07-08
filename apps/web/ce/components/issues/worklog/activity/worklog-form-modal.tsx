/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TIssueWorklog, TWorklogFormData } from "@plane/types";
import { Button, EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { convertHoursMinutesToMinutes, convertMinutesToHoursAndMinutes } from "@plane/utils";
// hooks
import { useWorklog } from "@/hooks/store/use-worklog";

// worklog duration is stored in minutes and validated against the internal API bounds (1..525600)
const MIN_WORKLOG_MINUTES = 1;
const MAX_WORKLOG_MINUTES = 525600;
const MAX_DESCRIPTION_LENGTH = 5000;

type TWorklogFormValues = {
  hours: number;
  minutes: number;
  description: string;
};

type TWorklogFormModal = {
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  /** when provided the modal edits the given entry, otherwise it creates a new one */
  worklog?: TIssueWorklog;
};

const getDefaultValues = (worklog?: TIssueWorklog): TWorklogFormValues => {
  if (!worklog) return { hours: 0, minutes: 0, description: "" };
  const { hours, minutes } = convertMinutesToHoursAndMinutes(worklog.duration ?? 0);
  return { hours, minutes, description: worklog.description ?? "" };
};

export const WorklogFormModal = observer(function WorklogFormModal(props: TWorklogFormModal) {
  const { isOpen, handleClose, workspaceSlug, projectId, issueId, worklog } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { createWorklog, updateWorklog } = useWorklog();
  // states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
  // form
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TWorklogFormValues>({ defaultValues: getDefaultValues(worklog) });

  const isEditing = Boolean(worklog);

  // reset the form whenever the modal (re)opens or the edited entry changes
  useEffect(() => {
    if (isOpen) {
      reset(getDefaultValues(worklog));
      setDurationError(null);
    }
  }, [isOpen, worklog, reset]);

  const onClose = () => {
    setIsSubmitting(false);
    setDurationError(null);
    handleClose();
  };

  const onSubmit = async (data: TWorklogFormValues) => {
    const totalMinutes = convertHoursMinutesToMinutes(Number(data.hours) || 0, Number(data.minutes) || 0);
    if (!Number.isFinite(totalMinutes) || totalMinutes < MIN_WORKLOG_MINUTES || totalMinutes > MAX_WORKLOG_MINUTES) {
      setDurationError(t("worklog.duration_error"));
      return;
    }
    setDurationError(null);
    setIsSubmitting(true);
    const description = data.description?.trim();
    const payload: TWorklogFormData = { duration: totalMinutes, ...(description ? { description } : {}) };
    const scope = isEditing ? "update" : "create";
    try {
      if (isEditing && worklog) {
        await updateWorklog(workspaceSlug, projectId, issueId, worklog.id, payload);
      } else {
        await createWorklog(workspaceSlug, projectId, issueId, payload);
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t(`worklog.toasts.${scope}.success.title`),
        message: t(`worklog.toasts.${scope}.success.message`),
      });
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t(`worklog.toasts.${scope}.error.title`),
        message: t(`worklog.toasts.${scope}.error.message`),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
        <h3 className="text-lg font-medium text-primary">
          {isEditing ? t("worklog.edit_work") : t("worklog.log_work")}
        </h3>

        <div className="flex items-start gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="worklog-hours" className="text-body-xs-regular text-tertiary">
              {t("worklog.hours")}
            </label>
            <Input
              id="worklog-hours"
              type="number"
              min={0}
              hasError={Boolean(durationError)}
              className="w-full"
              {...register("hours", { valueAsNumber: true, min: 0 })}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="worklog-minutes" className="text-body-xs-regular text-tertiary">
              {t("worklog.minutes")}
            </label>
            <Input
              id="worklog-minutes"
              type="number"
              min={0}
              max={59}
              hasError={Boolean(durationError)}
              className="w-full"
              {...register("minutes", { valueAsNumber: true, min: 0 })}
            />
          </div>
        </div>
        {durationError && <span className="-mt-2 text-body-xs-regular text-danger-strong">{durationError}</span>}

        <div className="flex flex-col gap-1">
          <label htmlFor="worklog-description" className="text-body-xs-regular text-tertiary">
            {t("worklog.description")}
          </label>
          <Controller
            control={control}
            name="description"
            rules={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            render={({ field: { value, onChange } }) => (
              <TextArea
                id="worklog-description"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.description)}
                placeholder={t("worklog.description_placeholder")}
                className="min-h-20 w-full"
              />
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={onClose} disabled={isSubmitting}>
            {t("worklog.cancel")}
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isEditing ? t("worklog.update") : t("worklog.submit")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
