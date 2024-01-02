import { useState } from "react";
import { add } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import { Calendar } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// components
import { CustomDatePicker } from "components/ui";
// ui
import { Button, CustomSelect, Input, TextArea, ToggleSwitch } from "@plane/ui";
// helpers
import { renderFormattedDate, renderFormattedPayloadDate } from "helpers/date-time.helper";
// types
import { IApiToken } from "@plane/types";

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

const getExpiryDate = (val: string): string | null => {
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
  // toast alert
  const { setToastAlert } = useToast();
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
      return setToastAlert({
        type: "error",
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
    else if (data.expired_at === "custom") payload.expired_at = renderFormattedPayloadDate(customDate ?? new Date());
    // if never expires is toggled off, and the user has selected a predefined date, set expired_at to the predefined date
    else {
      const expiryDate = getExpiryDate(data.expired_at ?? "");

      if (expiryDate) payload.expired_at = renderFormattedPayloadDate(expiryDate);
    }

    await onSubmit(payload).then(() => {
      reset(defaultValues);
      setCustomDate(null);
    });
  };

  const today = new Date();
  const tomorrow = add(today, { days: 1 });

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">Create token</h3>
        <div className="space-y-3">
          <div>
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
                  placeholder="Token title"
                  className="w-full text-sm font-medium"
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
                placeholder="Token description"
                className="h-24 w-full text-sm"
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
                          className={`flex items-center gap-2 rounded border-[0.5px] border-custom-border-200 px-2 py-1 ${
                            neverExpires ? "text-custom-text-400" : ""
                          }`}
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
              {watch("expired_at") === "custom" && (
                <CustomDatePicker
                  value={customDate}
                  onChange={(date) => setCustomDate(date ? new Date(date) : null)}
                  minDate={tomorrow}
                  customInput={
                    <div
                      className={`flex cursor-pointer items-center gap-2 !rounded border-[0.5px] border-custom-border-200 px-2 py-1 text-xs !shadow-none !duration-0 ${
                        customDate ? "w-[7.5rem]" : ""
                      } ${neverExpires ? "!cursor-not-allowed text-custom-text-400" : "hover:bg-custom-background-80"}`}
                    >
                      <Calendar className="h-3 w-3" />
                      {customDate ? renderFormattedDate(customDate) : "Set date"}
                    </div>
                  }
                  disabled={neverExpires}
                />
              )}
            </div>
            {!neverExpires && (
              <span className="text-xs text-custom-text-400">
                {watch("expired_at") === "custom"
                  ? customDate
                    ? `Expires ${renderFormattedDate(customDate)}`
                    : null
                  : watch("expired_at")
                  ? `Expires ${getExpiryDate(watch("expired_at") ?? "")}`
                  : null}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <div className="flex cursor-pointer items-center gap-1.5" onClick={toggleNeverExpires}>
          <div className="flex cursor-pointer items-center justify-center">
            <ToggleSwitch value={neverExpires} onChange={() => {}} size="sm" />
          </div>
          <span className="text-xs">Never expires</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Discard
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Generating..." : "Generate token"}
          </Button>
        </div>
      </div>
    </form>
  );
};
