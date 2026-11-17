/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { Radio, RadioIndicator } from "@makeplane/propel/elements/radio";
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

export function RadioInput({
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
}: RadioInputProps) {
  const labelId = React.useId();
  const wrapperClass = vertical ? "flex flex-col gap-1" : "flex gap-2";

  const setSelected = (value: string) => {
    onChange(value);
  };

  return (
    <div className={className}>
      {inputLabel && (
        <div id={labelId} className={cn(`mb-2`, inputLabelClassName)}>
          {inputLabel}
        </div>
      )}
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={!ariaLabel && inputLabel ? labelId : undefined}
        className={cn(`${wrapperClass}`, inputWrapperClassName)}
      >
        {options.map(({ value, label, disabled }, index) => (
          <label
            key={index}
            htmlFor={`${name}_${index}`}
            className={cn(
              "flex items-center gap-2 text-body-sm-regular",
              disabled ? `cursor-not-allowed border-subtle bg-layer-1` : ``,
              inputFieldClassName
            )}
          >
            <span className="relative flex shrink-0 items-center justify-center">
              <Radio
                data-checked={selected === value ? "" : undefined}
                data-disabled={disabled ? "" : undefined}
                render={
                  <input
                    id={`${name}_${index}`}
                    name={name}
                    className={cn(
                      "cursor-pointer appearance-none",
                      disabled ? "cursor-not-allowed" : "",
                      inputButtonClassName
                    )}
                    type="radio"
                    value={value}
                    disabled={disabled}
                    checked={selected === value}
                    onChange={() => setSelected(value)}
                    onClick={(event) => {
                      // Keep the existing selected-pointer notification without duplicating a new selection or Space.
                      if (selected === value && event.detail > 0) setSelected(value);
                    }}
                  />
                }
              />
              {selected === value && (
                <RadioIndicator
                  aria-hidden="true"
                  data-disabled={disabled ? "" : undefined}
                  render={
                    <span className="pointer-events-none absolute text-icon-accent-primary data-disabled:text-icon-disabled data-disabled:opacity-60" />
                  }
                />
              )}
            </span>
            <span className="w-full cursor-pointer">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
