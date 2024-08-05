import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// components
import { DateDropdown } from "@/components/dropdowns";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedPayloadDate } from "@/helpers/date-time.helper";
// plane web types
import { TDateAttributeDisplayOptions, TPropertyValueVariant } from "@/plane-web/types/issue-types";

type TDateValueSelectProps = {
  value: string[];
  variant: TPropertyValueVariant
  displayFormat: TDateAttributeDisplayOptions;
  isRequired?: boolean; // TODO: remove if not required.
  isDisabled?: boolean;
  onDateValueChange: (value: string[]) => Promise<void>;
};

export const DateValueSelect = observer((props: TDateValueSelectProps) => {
  const { value, variant, displayFormat, isDisabled = false, onDateValueChange } = props;
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
    <DateDropdown
      value={data?.[0]}
      onChange={handleDateChange}
      placeholder="Add date"
      buttonVariant={variant === "update" ? "transparent-with-text" : "border-with-text"}
      disabled={isDisabled}
      className="w-full flex-grow group"
      buttonContainerClassName="w-full text-left"
      buttonClassName={cn("text-sm", {
        "text-custom-text-400": !data?.length,
        "border-custom-border-200": variant === "create",
      })}
      hideIcon
      clearIconClassName="h-3 w-3 hidden group-hover:inline"
      formatToken={displayFormat}
    />
  );
});
