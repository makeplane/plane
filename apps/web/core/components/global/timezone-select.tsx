import type { FC } from "react";
import { observer } from "mobx-react";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import useTimezone from "@/hooks/use-timezone";

type TTimezoneSelect = {
  value: string | undefined;
  onChange: (value: string) => void;
  error?: boolean;
  label?: string;
  buttonClassName?: string;
  className?: string;
  optionsClassName?: string;
  disabled?: boolean;
};

export const TimezoneSelect = observer(function TimezoneSelect(props: TTimezoneSelect) {
  // props
  const {
    value,
    onChange,
    error = false,
    label = "Select a timezone",
    buttonClassName = "",
    className = "",
    optionsClassName = "",
    disabled = false,
  } = props;
  // hooks
  const { disabled: isDisabled, timezones, selectedValue } = useTimezone();

  return (
    <div>
      <CustomSearchSelect
        value={value}
        label={value && selectedValue ? selectedValue(value) : label}
        options={isDisabled || disabled ? [] : timezones}
        onChange={onChange}
        buttonClassName={cn(buttonClassName, {
          "border-danger-strong": error,
        })}
        className={cn("rounded-md border-[0.5px] !border-subtle", className)}
        optionsClassName={cn("w-72", optionsClassName)}
        input
        disabled={isDisabled || disabled}
      />
    </div>
  );
});
