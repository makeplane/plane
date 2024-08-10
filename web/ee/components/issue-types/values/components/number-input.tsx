import React, { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
// ui
import { Input } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web types
import { EIssuePropertyType, EIssuePropertyValueError, TIssueProperty, TPropertyValueVariant } from "@/plane-web/types";

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

  useEffect(() => {
    setData(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setData([newValue]);
  };

  return (
    <>
      <Input
        id={`number_input_${propertyDetail.id}`}
        type="number"
        value={data?.[0]}
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
          if (!isEqual(value, data)) {
            onNumberValueChange(data);
          }
          document.body?.removeAttribute("data-delay-outside-click");
        }}
        placeholder="Enter a number"
        inputSize={numberInputSize}
        disabled={isDisabled}
        hasError={Boolean(error)}
      />
      {Boolean(error) && (
        <span className="text-xs font-medium text-red-500">
          {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
        </span>
      )}
    </>
  );
});
