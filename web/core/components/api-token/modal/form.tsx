"use client";

import { useState } from "react";
import { add } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "lucide-react";
// types
import { IApiToken } from "@plane/types";
// ui
import { Button, CustomSelect, Input, TextArea, ToggleSwitch, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { DateDropdown } from "@/components/dropdowns";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";

type Props = {
  handleClose: () => void;
  neverExpires: boolean;
  toggleNeverExpires: () => void;
  onSubmit: (data: Partial<IApiToken>) => Promise<void>;
};

const EXPIRY_DATE_OPTIONS = [
  {
    key: "1_week",
    label: "1 week",
    value: { weeks: 1 },
  },
  {
    key: "1_month",
    label: "1 month",
    value: { months: 1 },
  },
  {
    key: "3_months",
    label: "3 months",
    value: { months: 3 },
  },
  {
    key: "1_year",
    label: "1 year",
    value: { years: 1 },
  },
];

const defaultValues: Partial<IApiToken> = {
  label: "",
  description: "",
  expired_at: null,
};

const getExpiryDate = (val: string): string | null | undefined => {
  const today = new Date();

  const dateToAdd = EXPIRY_DATE_OPTIONS.find((option) => option.key === val)?.value;

  if (dateToAdd) {
    const expiryDate = add(today, dateToAdd);

    return renderFormattedDate(expiryDate);
  }

  return null;
};

export const CreateApiTokenForm: React.FC<Props> = (props) => {
  const { handleClose, neverExpires, toggleNeverExpires, onSubmit } = props;
  // states
  const [customDate, setCustomDate] = useState<Date | null>(null);
  // form
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm<IApiToken>({ defaultValues });

  const handleFormSubmit = async (data: IApiToken) => {
    // if never expires is toggled off, and the user has not selected a custom date or a predefined date, show an error
    if (!neverExpires && (!data.expired_at || (data.expired_at === "custom" && !customDate)))
      return setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select an expiration date.",
      });

    const payload: Partial<IApiToken> = {
      label: data.label,
      description: data.description,
    };

    // if never expires is toggled on, set expired_at to null
    if (neverExpires) payload.expired_at = null;
    // if never expires is toggled off, and the user has selected a custom date, set expired_at to the custom date
    else if (data.expired_at === "custom") payload.expired_at = renderFormattedPayloadDate(customDate);
    // if never expires is toggled off, and the user has selected a predefined date, set expired_at to the predefined date
    else {
      const expiryDate = getExpiryDate(data.expired_at ?? "");

      if (expiryDate) payload.expired_at = renderFormattedPayloadDate(new Date(expiryDate));
    }

    await onSubmit(payload).then(() => {
      reset(defaultValues);
      setCustomDate(null);
    });
  };

  const today = new Date();
  const tomorrow = add(today, { days: 1 });
  const expiredAt = watch("expired_at");

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-5 p-5">
        <h3 className="text-xl font-medium text-custom-text-200">Create token</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Controller
              control={control}
              name="label"
              rules={{
                required: "Title is required",
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
                },
                validate: (val) => val.trim() !== "" || "Title is required",
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  type="text"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors.label)}
                  placeholder="Title"
                  className="w-full text-base"
                />
              )}
            />
            {errors.label && <span className="text-xs text-red-500">{errors.label.message}</span>}
          </div>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <TextArea
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.description)}
                placeholder="Description"
                className="w-full text-base resize-none min-h-24"
              />
            )}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="expired_at"
                render={({ field: { onChange, value } }) => {
                  const selectedOption = EXPIRY_DATE_OPTIONS.find((option) => option.key === value);

                  return (
                    <CustomSelect
                      customButton={
                        <div
                          className={cn(
                            "h-7 flex items-center gap-2 rounded border-[0.5px] border-custom-border-300 px-2 py-0.5",
                            {
                              "text-custom-text-400": neverExpires,
                            }
                          )}
                        >
                          <Calendar className="h-3 w-3" />
                          {value === "custom"
                            ? "Custom date"
                            : selectedOption
                              ? selectedOption.label
                              : "Set expiration date"}
                        </div>
                      }
                      value={value}
                      onChange={onChange}
                      disabled={neverExpires}
                    >
                      {EXPIRY_DATE_OPTIONS.map((option) => (
                        <CustomSelect.Option key={option.key} value={option.key}>
                          {option.label}
                        </CustomSelect.Option>
                      ))}
                      <CustomSelect.Option value="custom">Custom</CustomSelect.Option>
                    </CustomSelect>
                  );
                }}
              />
              {expiredAt === "custom" && (
                <div className="h-7">
                  <DateDropdown
                    value={customDate}
                    onChange={(date) => setCustomDate(date)}
                    minDate={tomorrow}
                    icon={<Calendar className="h-3 w-3" />}
                    buttonVariant="border-with-text"
                    placeholder="Set date"
                    disabled={neverExpires}
                  />
                </div>
              )}
            </div>
            {!neverExpires && (
              <span className="text-xs text-custom-text-400">
                {expiredAt === "custom"
                  ? customDate
                    ? `Expires ${renderFormattedDate(customDate)}`
                    : null
                  : expiredAt
                    ? `Expires ${getExpiryDate(expiredAt ?? "")}`
                    : null}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-2 border-t-[0.5px] border-custom-border-200">
        <div className="flex cursor-pointer items-center gap-1.5" onClick={toggleNeverExpires}>
          <div className="flex cursor-pointer items-center justify-center">
            <ToggleSwitch value={neverExpires} onChange={() => {}} size="sm" />
          </div>
          <span className="text-xs">Never expires</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Generating" : "Generate token"}
          </Button>
        </div>
      </div>
    </form>
  );
};
