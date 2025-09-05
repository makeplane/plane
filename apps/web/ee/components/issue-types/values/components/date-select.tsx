import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import {
  EIssuePropertyType,
  EIssuePropertyValueError,
  TDateAttributeDisplayOptions,
  TIssueProperty,
  TPropertyValueVariant,
} from "@plane/types";
import { cn, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";

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
          "text-sm bg-custom-background-100",
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
