import React, { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EIssuePropertyValueError, TIssueProperty, TPropertyValueVariant } from "@plane/types";
import { Input } from "@plane/ui";
import { cn } from "@plane/utils";

type TNumberValueInputProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.DECIMAL>>;
  value: string[];
  variant: TPropertyValueVariant;
  numberInputSize?: "xs" | "sm" | "md";
  error?: EIssuePropertyValueError;
  isDisabled?: boolean;
  className?: string;
  onNumberValueChange: (value: string[]) => Promise<void>;
};

export const NumberValueInput = observer((props: TNumberValueInputProps) => {
  const {
    propertyDetail,
    value,
    variant,
    numberInputSize = "sm",
    error,
    isDisabled = false,
    className = "",
    onNumberValueChange,
  } = props;
  // states
  const [data, setData] = useState<string[]>([]);
  // plane hooks
  const { t } = useTranslation();

  useEffect(() => {
    setData(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setData([newValue]);
  };

  const handleNumberValueChange = () => {
    // trim and filter empty values
    const trimmedValue = data.map((val) => val.trim()).filter((val) => val);
    // update property data
    if (!isEqual(value, trimmedValue)) {
      onNumberValueChange(trimmedValue);
    }
  };

  return (
    <>
      <Input
        id={`number_input_${propertyDetail.id}`}
        type="number"
        value={data?.[0] ?? ""}
        onChange={handleChange}
        className={cn(
          "w-full px-2 resize-none text-sm bg-custom-background-100 rounded border-0",
          {
            "border-[0.5px]": variant === "create" || Boolean(error),
            "cursor-not-allowed": isDisabled,
          },
          className
        )}
        onClick={() => {
          // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
          document.body?.setAttribute("data-delay-outside-click", "true");
        }}
        onWheel={(e) => e.currentTarget.blur()}
        onBlur={() => {
          handleNumberValueChange();
          document.body?.removeAttribute("data-delay-outside-click");
        }}
        placeholder={t("work_item_types.settings.properties.attributes.number.default.placeholder")}
        inputSize={numberInputSize}
        disabled={isDisabled}
        hasError={Boolean(error)}
      />
      {Boolean(error) && (
        <span className="text-xs font-medium text-red-500">
          {error === "REQUIRED" ? t("common.errors.entity_required", { entity: propertyDetail.display_name }) : error}
        </span>
      )}
    </>
  );
});
