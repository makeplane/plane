import React from "react";
import { Field, Label, Radio, RadioGroup } from "@headlessui/react";
import { cn } from "../../helpers";
// helpers

type RadioInputProps = {
  label: string | React.ReactNode | undefined;
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

  // return <h1>Hello</h1>;

  return (
    <RadioGroup value={selected} onChange={setSelected} aria-label={aria} className={className}>
      <Label className={cn(`mb-2`, inputLabelClassName)}>{inputLabel}</Label>
      <div className={cn(`${wrapperClass}`, inputWrapperClassName)}>
        {options.map(({ value, label, disabled }, index) => (
          <Field key={index} className={cn("flex items-center gap-2", inputFieldClassName)}>
            <Radio
              value={value}
              className={cn(
                "group flex size-5 items-center justify-center rounded-full border border-custom-border-400 bg-custom-background-500 data-[checked]:bg-custom-primary-200 data-[checked]:border-custom-primary-100 cursor-pointer data-[disabled]:bg-custom-background-200 data-[disabled]:border-custom-border-200 data-[disabled]:cursor-not-allowed",
                inputButtonClassName
              )}
              disabled={disabled}
            >
              <span className="invisible size-2 rounded-full bg-white group-data-[checked]:visible" />
            </Radio>
            <Label className="text-base cursor-pointer">{label}</Label>
          </Field>
        ))}
      </div>
    </RadioGroup>
  );
};

export default RadioInput;
