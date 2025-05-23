import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType } from "@plane/constants";
import { EIssuePropertyValueError, TIssueProperty, TPropertyValueVariant } from "@plane/types";
// ui
import { ToggleSwitch } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type TBooleanInputProps = {
  value: string[];
  isDisabled?: boolean;
  onBooleanValueChange: (value: string[]) => Promise<void>;
};

export const BooleanInput = observer((props: TBooleanInputProps) => {
  const { value, isDisabled = false, onBooleanValueChange } = props;
  // states
  const [data, setData] = useState<string[]>([]);

  const handleChange = (value: boolean) => {
    setData([value.toString()]);
    onBooleanValueChange([value.toString()]);
  };

  useEffect(() => {
    setData(value);
  }, [value]);

  return (
    <ToggleSwitch
      value={data?.[0] === "true"}
      onChange={(value) => handleChange(value)}
      disabled={isDisabled}
      className={cn({
        "cursor-not-allowed": isDisabled,
      })}
    />
  );
});
