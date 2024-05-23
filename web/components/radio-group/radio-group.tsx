import React from "react";
import { Field, Label, Radio, RadioGroup } from "@headlessui/react";
// helpers
import { cn } from "@/helpers/common.helper";

type RadioInputProps = {
  label: string | React.ReactNode | undefined;
  labelClassName?: string;
  ariaLabel?: string;
  options: { label: string; value: string; disabled?: boolean }[];
  vertical?: boolean;
  selected: string;
  onChange: (value: string) => void;
  className?: string;
};

const RadioInput = ({
  label: inputLabel,
  labelClassName: inputLabelClassName,
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
    <RadioGroup value={selected} onChange={setSelected} aria-label={aria} className={className}>
      <Label className={cn(`mb-2`, inputLabelClassName)}>{inputLabel}</Label>
      <div className={`${wrapperClass}`}>
        {options.map(({ value, label, disabled }) => (
          <Field key={label} className="flex items-center gap-2">
            <Radio
              value={value}
              className="group flex size-5 items-center justify-center rounded-full border border-custom-border-400 bg-custom-background-500 data-[checked]:bg-custom-primary-200 data-[checked]:border-custom-primary-100 cursor-pointer
              data-[disabled]:bg-custom-background-200
              data-[disabled]:border-custom-border-200
              data-[disabled]:cursor-not-allowed"
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

export { RadioInput };
