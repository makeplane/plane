"use client";

import { FC, FormEvent, useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { Button, Input, TextArea } from "@plane/ui";
// plane web helpers
import { convertHoursMinutesToMinutes } from "@/helpers/date-time.helper";
// plane web types
import { TWorklog } from "@/plane-web/types";

type TWorklogForm = {
  hours: string;
  minutes: string;
  description: string;
};

type TWorklogFormErrors = Record<keyof TWorklogForm, string>;

type TWorklogFormRoot = {
  data: TWorklogForm;
  onSubmit: (payload: Partial<TWorklog>) => Promise<{ status: string }>;
  onCancel: () => void;
  buttonDisabled: boolean;
  buttonTitle: string;
};

export const WorklogFormRoot: FC<TWorklogFormRoot> = (props) => {
  const { data, onSubmit, onCancel, buttonDisabled, buttonTitle } = props;
  // states
  const [formData, setFromData] = useState<Partial<TWorklogForm> | undefined>(undefined);
  const [errors, setErrors] = useState<Partial<TWorklogFormErrors> | undefined>(undefined);

  useEffect(() => {
    if (data && !formData) setFromData(data);
  }, [data, formData]);

  const handleFormData = <T extends keyof TWorklogForm>(key: T, value: TWorklogForm[T]) => {
    setFromData((prev) => ({ ...prev, [key]: value }));
    setErrors(undefined);
  };

  const formSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData) return;

    const hours = Number(formData?.hours) || undefined;
    const minutes = Number(formData?.minutes) || undefined;
    let currentErrors: Partial<Record<keyof TWorklogForm, string>> = {};

    if (!hours && !minutes) {
      currentErrors = { ...currentErrors, hours: "Hour field is required", minutes: "Minute field is required" };
      setErrors(currentErrors);
      return;
    }

    const payload: Partial<TWorklog> = {
      duration: Math.round(convertHoursMinutesToMinutes(hours || 0, minutes || 0)),
      description: formData.description || "",
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={formSubmit} className="space-y-2">
      <div className="space-y-2">
        {/* Timer */}
        <div className="inline-flex justify-between items-center gap-1 bg-custom-background-90 text-custom-text-300 rounded-full px-2.5 py-1.5 ">
          <Timer className="w-3 h-3" />
          <div className="font-medium text-xs leading-3">
            {formData?.hours || 0}h {formData?.minutes || 0}m
          </div>
        </div>

        <div className="flex items-center">
          {/* hours */}
          <Input
            id="worklog-hours"
            type="number"
            name="hours"
            placeholder="Hours"
            value={formData?.hours}
            onChange={(e) => handleFormData("hours", e.target.value)}
            hasError={(errors && Boolean(errors.hours)) || false}
            className="w-full rounded-r-none"
            autoFocus
            min={0}
            step="any"
          />
          {/* minutes */}
          <Input
            id="worklog-minutes"
            type="number"
            name="minutes"
            placeholder="Minutes"
            value={formData?.minutes}
            onChange={(e) => handleFormData("minutes", e.target.value)}
            hasError={(errors && Boolean(errors.minutes)) || false}
            className="w-full border-l-0 rounded-l-none"
            min={0}
          />
        </div>

        {/* description */}
        <TextArea
          id="worklog-description"
          name="description"
          placeholder="Description"
          value={formData?.description}
          onChange={(e) => handleFormData("description", e.target.value)}
          hasError={(errors && Boolean(errors.description)) || false}
          className="w-full text-base resize-none min-h-24"
        />
      </div>

      {/* buttons */}
      <div className="flex justify-end items-center gap-2">
        <Button type="button" variant="neutral-primary" size="sm" disabled={buttonDisabled} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={buttonDisabled}>
          {buttonTitle}
        </Button>
      </div>
    </form>
  );
};
