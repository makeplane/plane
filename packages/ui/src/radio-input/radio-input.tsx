import { Field, Label, Radio, RadioGroup } from "@headlessui/react";
import React from "react";

type RadioInputProps = {
  label: string | React.ReactNode | undefined;
  ariaLabel?: string;
  options: { label: string; value: string; disabled?: boolean }[];
  vertical?: boolean;
  selected: string;
};

const RadioInput = ({ label: inputLabel, options, vertical, selected, ariaLabel }: RadioInputProps) => {
  const wrapperClass = vertical ? "flex flex-col gap-1" : "flex gap-2";

  const setSelected = (value: string) => {
    console.log(value);
  };

  let aria = ariaLabel ? ariaLabel.toLowerCase().replace(" ", "-") : "";
  if (!aria && typeof inputLabel === "string") {
    aria = inputLabel.toLowerCase().replace(" ", "-");
  } else {
    aria = "radio-input";
  }

  return (
    <RadioGroup value={selected} onChange={setSelected} aria-label={aria}>
      <Label className="">{inputLabel}</Label>
      <div className={`${wrapperClass}`}>
        {options.map(({ value, label }) => (
          <Field key={label} className="flex items-center gap-2">
            <Radio
              value={value}
              className="group flex size-5 items-center justify-center rounded-full border bg-white data-[checked]:bg-blue-400"
            >
              <span className="invisible size-2 rounded-full bg-white group-data-[checked]:visible" />
            </Radio>
            <Label>{label}</Label>
          </Field>
        ))}
      </div>
    </RadioGroup>
  );
};

export { RadioInput };
