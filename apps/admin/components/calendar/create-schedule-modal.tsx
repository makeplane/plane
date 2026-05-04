/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Switch } from "@plane/propel/switch";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkScheduleCreate, TWeekPatternKey } from "@plane/types";
import { useBusinessCalendar } from "@/hooks/store";

// Ordered Mon=0..Sun=6 — index matches backend week_pattern boolean array
const WEEK_DAYS: { key: TWeekPatternKey; label: string; index: number }[] = [
  { key: "MON", label: "Mon", index: 0 },
  { key: "TUE", label: "Tue", index: 1 },
  { key: "WED", label: "Wed", index: 2 },
  { key: "THU", label: "Thu", index: 3 },
  { key: "FRI", label: "Fri", index: 4 },
  { key: "SAT", label: "Sat", index: 5 },
  { key: "SUN", label: "Sun", index: 6 },
];

// Default: Mon–Fri working, Sat–Sun off
const DEFAULT_WEEK_PATTERN: boolean[] = [true, true, true, true, true, false, false];

type FormValues = {
  name: string;
  timezone: string;
  country_code: string;
  is_default: boolean;
  week_pattern: boolean[];
};

type Props = { open: boolean; onClose: () => void };

export const CreateScheduleModal = observer(function CreateScheduleModal({ open, onClose }: Props) {
  const { createSchedule } = useBusinessCalendar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      timezone: "Asia/Ho_Chi_Minh",
      country_code: "VN",
      is_default: false,
      week_pattern: DEFAULT_WEEK_PATTERN,
    },
  });

  const weekPattern = watch("week_pattern");

  const toggleDay = (index: number) => {
    const next = [...weekPattern];
    next[index] = !next[index];
    setValue("week_pattern", next);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: IWorkScheduleCreate = {
        name: data.name,
        timezone: data.timezone,
        country_code: data.country_code,
        is_default: data.is_default,
        week_pattern: data.week_pattern,
      };
      await createSchedule(payload);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Schedule created" });
      reset();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to create schedule" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6 space-y-4">
          <Dialog.Title>Create business calendar</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="schedule-name" className="text-body-xs-medium text-secondary">
                Schedule name *
              </label>
              <Input
                id="schedule-name"
                {...register("name", { required: "Required" })}
                placeholder="e.g. VN Banking Schedule"
              />
              {errors.name && <p className="text-caption-sm-regular text-danger-primary">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="schedule-timezone" className="text-body-xs-medium text-secondary">
                  Timezone
                </label>
                <Input id="schedule-timezone" {...register("timezone")} placeholder="Asia/Ho_Chi_Minh" />
              </div>
              <div className="space-y-1">
                <label htmlFor="schedule-country" className="text-body-xs-medium text-secondary">
                  Country
                </label>
                <Input id="schedule-country" {...register("country_code")} placeholder="VN" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="schedule-workdays" className="text-body-xs-medium text-secondary">
                Working days
              </label>
              <div id="schedule-workdays" className="flex gap-2 flex-wrap">
                {WEEK_DAYS.map(({ key, label, index }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`px-3 py-1.5 rounded border text-body-xs-medium transition-colors ${
                      weekPattern[index]
                        ? "bg-accent-subtle text-accent-primary border-accent-strong"
                        : "bg-surface-2 text-secondary border-subtle hover:border-strong"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="is_default"
                render={({ field }) => (
                  <Switch value={field.value} onChange={field.onChange} size="sm" label="Set as default schedule" />
                )}
              />
              <span className="text-body-xs-medium text-secondary">Set as default schedule</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create schedule"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
