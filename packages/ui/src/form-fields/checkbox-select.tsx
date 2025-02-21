import React from "react";
// helpers
import { cn } from "../../helpers";
// components
import { Checkbox } from "./checkbox";

type CheckboxSelectProps<T> = {
  name?: string;
  label?: string | React.ReactNode | undefined;
  selected: T;
  options: { label: string | React.ReactNode; key: T; indeterminate?: boolean; disabled?: boolean }[];
  onChange: (key: T) => void;
  className?: string;
  labelClassName?: string;
  checkboxClassName?: { input?: string; icon?: string; label?: string; container?: string };
  fieldClassName?: string;
  wrapperClassName?: string;
  vertical?: boolean;
};

// TODO: refactor this to allow multiple selection
export const CheckboxSelect = <T extends string | number | readonly string[] | undefined>(
  props: CheckboxSelectProps<T>
) => {
  const {
    name = "checkbox-select",
    label: inputLabel,
    labelClassName = "",
    wrapperClassName = "",
    fieldClassName = "",
    checkboxClassName: {
      input: inputClassName = "",
      icon: iconClassName = "",
      label: checkboxLabelClassName = "",
      container: containerClassName = "",
    } = {},
    options,
    vertical,
    selected,
    onChange,
    className,
  } = props;

  const wrapperClass = vertical ? "flex flex-col gap-1" : "flex gap-2";

  const setSelected = (value: T) => {
    onChange(value);
  };

  return (
    <div className={className}>
      {inputLabel && <div className={cn(`mb-2`, labelClassName)}>{inputLabel}</div>}
      <div className={cn(`${wrapperClass}`, wrapperClassName)}>
        {options.map(({ key, label, indeterminate, disabled }, index) => (
          <div
            key={index}
            onClick={() => !disabled && setSelected(key)}
            className={cn(
              "flex items-center gap-2",
              disabled ? `bg-custom-background-200 border-custom-border-200 cursor-not-allowed` : ``,
              fieldClassName
            )}
          >
            <Checkbox
              id={`${name}_${index}`}
              name={name}
              value={key}
              checked={selected === key}
              className={inputClassName}
              iconClassName={iconClassName}
              containerClassName={containerClassName}
              indeterminate={indeterminate}
              disabled={disabled}
            />
            <label htmlFor={`${name}_${index}`} className={cn("text-base cursor-pointer", checkboxLabelClassName)}>
              {label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
