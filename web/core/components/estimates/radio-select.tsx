import React from "react";
// helpers
import { cn } from "@plane/utils";

type RadioInputProps = {
  name?: string;
  label?: string | React.ReactNode;
  wrapperClassName?: string;
  fieldClassName?: string;
  buttonClassName?: string;
  labelClassName?: string;
  ariaLabel?: string;
  options: { label: string | React.ReactNode; value: string; disabled?: boolean }[];
  vertical?: boolean;
  selected: string;
  onChange: (value: string) => void;
  className?: string;
};

export const RadioInput = ({
  name = "radio-input",
  label: inputLabel,
  labelClassName: inputLabelClassName = "",
  wrapperClassName: inputWrapperClassName = "",
  fieldClassName: inputFieldClassName = "",
  buttonClassName: inputButtonClassName = "",
  options,
  vertical,
  selected,
  ariaLabel,
  onChange,
  className,
}: RadioInputProps) => {
  const wrapperClass = vertical ? "flex flex-col gap-1" : "flex gap-2";

  const setSelected = (value: string) => {
    onChange(value);
  };

  let aria = ariaLabel ? ariaLabel.toLowerCase().replace(" ", "-") : "";
  if (!aria && typeof inputLabel === "string") {
    aria = inputLabel.toLowerCase().replace(" ", "-");
  } else {
    aria = "radio-input";
  }

  return (
    <div className={className}>
      {inputLabel && <div className={cn(`mb-2`, inputLabelClassName)}>{inputLabel}</div>}
      <div className={cn(`${wrapperClass}`, inputWrapperClassName)}>
        {options.map(({ value, label, disabled }, index) => (
          <div
            key={index}
            onClick={() => !disabled && setSelected(value)}
            className={cn(
              "flex items-center gap-2 text-base",
              disabled ? `bg-custom-background-200 border-custom-border-200 cursor-not-allowed` : ``,
              inputFieldClassName
            )}
          >
            <input
              id={`${name}_${index}`}
              name={name}
              className={cn(
                `group flex flex-shrink-0 size-5 items-center justify-center rounded-full border border-custom-border-400 bg-custom-background-500 cursor-pointer`,
                selected === value ? `bg-custom-primary-200 border-custom-primary-100 ` : ``,
                disabled ? `bg-custom-background-200 border-custom-border-200 cursor-not-allowed` : ``,
                inputButtonClassName
              )}
              type="radio"
              value={value}
              disabled={disabled}
              checked={selected === value}
            />
            <label htmlFor={`${name}_${index}`} className="cursor-pointer w-full">
              {label}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadioInput;
