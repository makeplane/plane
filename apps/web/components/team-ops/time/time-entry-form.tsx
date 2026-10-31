/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@makeplane/propel/components/button";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { TextAreaField } from "@makeplane/propel/components/text-area-field";
import { setToast } from "@plane/blocks/toast";
import { splitDuration, toDateKey, toDurationSeconds } from "@plane/services";
import { useTranslation } from "@plane/i18n";
import type { TTimeEntry, TTimeEntryPayload } from "@plane/types";
// local imports
import type { TPickedWorkItem } from "./work-item-picker";
import { WorkItemPicker } from "./work-item-picker";

type FormValues = {
  date: string;
  startTime: string;
  hours: string;
  minutes: string;
  note: string;
  isBillable: boolean;
};

type Props = {
  workspaceSlug: string;
  /** The entry being edited, or `null` to add a new one. */
  entry: TTimeEntry | null;
  onSubmit: (payload: TTimeEntryPayload) => Promise<void>;
  onClose: () => void;
};

const pad = (value: number) => String(value).padStart(2, "0");
const toTimeKey = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const getDefaults = (entry: TTimeEntry | null): FormValues => {
  if (entry) {
    const started = new Date(entry.started_at);
    const { hours, minutes } = splitDuration(entry.duration_seconds);
    return {
      date: toDateKey(started),
      startTime: toTimeKey(started),
      hours: String(hours),
      minutes: String(minutes),
      note: entry.note,
      isBillable: entry.is_billable,
    };
  }
  const now = new Date();
  return { date: toDateKey(now), startTime: toTimeKey(now), hours: "1", minutes: "0", note: "", isBillable: false };
};

export function TimeEntryForm(props: Props) {
  const { workspaceSlug, entry, onSubmit, onClose } = props;
  // states
  const [workItem, setWorkItem] = useState<TPickedWorkItem | null>(
    entry?.issue && entry.issue_detail
      ? {
          id: entry.issue,
          name: entry.issue_detail.name,
          key: `${entry.issue_detail.project_identifier}-${entry.issue_detail.sequence_id}`,
        }
      : null
  );
  // hooks
  const { t } = useTranslation();
  const defaultValues = useMemo(() => getDefaults(entry), [entry]);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues });

  const handleFormSubmit = async (values: FormValues) => {
    const duration = toDurationSeconds(Number(values.hours), Number(values.minutes));
    if (duration === null) {
      setError("hours", { message: t("team_ops.form.duration_invalid") });
      return;
    }
    const startedAt = new Date(`${values.date}T${values.startTime}`);
    if (Number.isNaN(startedAt.getTime())) {
      setError("date", { message: t("team_ops.form.date_invalid") });
      return;
    }

    try {
      await onSubmit({
        issue: workItem?.id ?? null,
        started_at: startedAt.toISOString(),
        duration_seconds: duration,
        note: values.note.trim(),
        is_billable: values.isBillable,
      });
      onClose();
    } catch (error) {
      const message =
        error instanceof Object
          ? Object.values(error as Record<string, unknown>)
              .flat()
              .join(" ")
          : "";
      setToast({ type: "error", title: t("team_ops.toasts.error_title"), message });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 flex-1 flex-col">
      <DialogMain>
        <DialogHeader>
          <DialogHeading>
            <DialogTitle>{entry ? t("team_ops.form.title_edit") : t("team_ops.form.title_create")}</DialogTitle>
          </DialogHeading>
        </DialogHeader>
        <DialogBody tabIndex={0}>
          <div className="space-y-3">
            <WorkItemPicker workspaceSlug={workspaceSlug} value={workItem} onChange={setWorkItem} />
            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={control}
                name="date"
                rules={{ required: t("team_ops.form.date_invalid") }}
                render={({ field: { value, onChange, ref } }) => (
                  <InputField
                    type="date"
                    size="lg"
                    orientation="vertical"
                    label={t("team_ops.form.date")}
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    error={errors.date?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="startTime"
                rules={{ required: t("team_ops.form.date_invalid") }}
                render={({ field: { value, onChange, ref } }) => (
                  <InputField
                    type="time"
                    size="lg"
                    orientation="vertical"
                    label={t("team_ops.form.start_time")}
                    value={value}
                    onChange={onChange}
                    ref={ref}
                  />
                )}
              />
              <Controller
                control={control}
                name="hours"
                render={({ field: { value, onChange, ref } }) => (
                  <InputField
                    type="number"
                    min={0}
                    max={24}
                    size="lg"
                    orientation="vertical"
                    label={t("team_ops.form.hours")}
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    error={errors.hours?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="minutes"
                render={({ field: { value, onChange, ref } }) => (
                  <InputField
                    type="number"
                    min={0}
                    max={59}
                    size="lg"
                    orientation="vertical"
                    label={t("team_ops.form.minutes")}
                    value={value}
                    onChange={onChange}
                    ref={ref}
                  />
                )}
              />
            </div>
            <Controller
              control={control}
              name="note"
              render={({ field: { value, onChange } }) => (
                <TextAreaField
                  size="lg"
                  resize="none"
                  autoResize
                  maxRows={6}
                  value={value}
                  onChange={onChange}
                  placeholder={t("team_ops.form.note")}
                  aria-label={t("team_ops.form.note")}
                />
              )}
            />
            <Controller
              control={control}
              name="isBillable"
              render={({ field: { value, onChange } }) => (
                <CheckboxField
                  size="lg"
                  label={t("team_ops.form.billable")}
                  checked={value}
                  onCheckedChange={(checked) => onChange(checked === true)}
                />
              )}
            />
          </div>
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <Button variant="secondary" size="sm" stretch="auto" label={t("cancel")} onClick={onClose} />
        <Button
          variant="primary"
          type="submit"
          size="sm"
          stretch="auto"
          label={t("team_ops.form.save")}
          loading={isSubmitting}
        />
      </DialogActions>
    </form>
  );
}
