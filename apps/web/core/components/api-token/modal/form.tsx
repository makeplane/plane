import { useState } from "react";
import { add } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "lucide-react";
// types
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IApiToken } from "@plane/types";
// ui
import { CustomSelect, Input, TextArea, ToggleSwitch } from "@plane/ui";
import { cn, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
// helpers
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

const getExpiryDate = (val: string): Date | null | undefined => {
  const today = new Date();
  const dateToAdd = EXPIRY_DATE_OPTIONS.find((option) => option.key === val)?.value;
  if (dateToAdd) return add(today, dateToAdd);
  return null;
};

const getFormattedDate = (date: Date): Date => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  return add(date, { hours, minutes, seconds });
};

export function CreateApiTokenForm(props: Props) {
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
  // hooks
  const { t } = useTranslation();

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
    else if (data.expired_at === "custom") {
      payload.expired_at = customDate && getFormattedDate(customDate).toISOString();
    }
    // if never expires is toggled off, and the user has selected a predefined date, set expired_at to the predefined date
    else {
      const expiryDate = getExpiryDate(data.expired_at ?? "");
      if (expiryDate) payload.expired_at = expiryDate.toISOString();
    }

    await onSubmit(payload).then(() => {
      reset(defaultValues);
      setCustomDate(null);
    });
  };

  const today = new Date();
  const tomorrow = add(today, { days: 1 });
  const expiredAt = watch("expired_at");
  const expiryDate = getExpiryDate(expiredAt ?? "");
  const customDateFormatted = customDate && getFormattedDate(customDate);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-5 p-5">
        <h3 className="text-18 font-medium text-secondary">
          {t("workspace_settings.settings.api_tokens.create_token")}
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Controller
              control={control}
              name="label"
              rules={{
                required: t("title_is_required"),
                maxLength: {
                  value: 255,
                  message: t("title_should_be_less_than_255_characters"),
                },
                validate: (val) => val.trim() !== "" || t("title_is_required"),
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  type="text"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors.label)}
                  placeholder={t("title")}
                  className="w-full text-14"
                />
              )}
            />
            {errors.label && <span className="text-11 text-danger-primary">{errors.label.message}</span>}
          </div>
          <Controller
            control={control}
            name="description"
            render={({ field: { value, onChange } }) => (
              <TextArea
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.description)}
                placeholder={t("description")}
                className="w-full text-14 resize-none min-h-24"
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
                            "h-7 flex items-center gap-2 rounded-sm border-[0.5px] border-strong px-2 py-0.5",
                            {
                              "text-placeholder": neverExpires,
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
              <span className="text-11 text-placeholder">
                {expiredAt === "custom"
                  ? customDate
                    ? `Expires ${renderFormattedDate(customDateFormatted ?? "")} at ${renderFormattedTime(customDateFormatted ?? "")}`
                    : null
                  : expiredAt
                    ? `Expires ${renderFormattedDate(expiryDate ?? "")} at ${renderFormattedTime(expiryDate ?? "")}`
                    : null}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-between gap-2 border-t-[0.5px] border-subtle">
        <div className="flex cursor-pointer items-center gap-1.5" onClick={toggleNeverExpires}>
          <div className="flex cursor-pointer items-center justify-center">
            <ToggleSwitch value={neverExpires} onChange={() => {}} size="sm" />
          </div>
          <span className="text-11">{t("workspace_settings.settings.api_tokens.never_expires")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {isSubmitting
              ? t("workspace_settings.settings.api_tokens.generating")
              : t("workspace_settings.settings.api_tokens.generate_token")}
          </Button>
        </div>
      </div>
    </form>
  );
}
