import React, { useEffect, useState } from "react";
import { isEqual } from "lodash";
import { observer } from "mobx-react";
// ui
import { Input } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web types
import { TPropertyValueVariant } from "@/plane-web/types";

type TNumberValueInputProps = {
  propertyId: string | undefined;
  value: string[];
  variant: TPropertyValueVariant;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  onNumberValueChange: (value: string[]) => Promise<void>;
};

export const NumberValueInput = observer((props: TNumberValueInputProps) => {
  const {
    propertyId,
    value,
    variant,
    isRequired = false,
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
    <Input
      id={`number_input_${propertyId}`}
      type="number"
      value={data?.[0]}
      onChange={handleChange}
      className={cn(
        "w-full px-2 resize-none text-sm bg-custom-background-100 rounded border-0 border-custom-border-200",
        {
          "border-[0.5px]": variant === "create",
          "cursor-not-allowed": isDisabled,
        },
        className
      )}
      onWheel={(e) => e.currentTarget.blur()}
      onBlur={() => !isEqual(data, value) && onNumberValueChange(data)}
      placeholder="Enter a number"
      required={isRequired}
      disabled={isDisabled}
    />
  );
});
