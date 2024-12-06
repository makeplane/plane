import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// components
import { DateDropdown } from "@/components/dropdowns";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// plane web types
import {
  EIssuePropertyType,
  EIssuePropertyValueError,
  TDateAttributeDisplayOptions,
  TIssueProperty,
  TPropertyValueVariant,
} from "@/plane-web/types/issue-types";

type TDateValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.DATETIME>>;
  value: string[];
  variant: TPropertyValueVariant;
  displayFormat: TDateAttributeDisplayOptions;
  error?: EIssuePropertyValueError;
  isDisabled?: boolean;
  buttonClassName?: string;
  onDateValueChange: (value: string[]) => Promise<void>;
};

export const DateValueSelect = observer((props: TDateValueSelectProps) => {
  const {
    propertyDetail,
    value,
    variant,
    displayFormat,
    error,
    isDisabled = false,
    buttonClassName,
    onDateValueChange,
  } = props;
  // states
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    setData(value);
  }, [value]);

  const handleDateChange = (date: Date | null) => {
    const formattedDate = renderFormattedPayloadDate(date);
    const updatedValue = formattedDate ? [formattedDate] : [];
    setData(updatedValue);
    onDateValueChange(updatedValue);
  };

  return (
    <>
      <DateDropdown
        value={data?.[0]}
        onChange={handleDateChange}
        placeholder="Choose date"
        buttonVariant={variant === "update" && !Boolean(error) ? "transparent-with-text" : "border-with-text"}
        disabled={isDisabled}
        className="w-full flex-grow group"
        buttonContainerClassName="w-full text-left"
        buttonClassName={cn(
          "text-sm",
          {
            "text-custom-text-400": !data?.length,
            "border-custom-border-200": variant === "create",
            "border-red-500": Boolean(error),
          },
          buttonClassName
        )}
        hideIcon
        clearIconClassName="h-3 w-3 hidden group-hover:inline"
        formatToken={displayFormat}
      />
      {Boolean(error) && (
        <span className="text-xs font-medium text-red-500">
          {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
        </span>
      )}
    </>
  );
});
