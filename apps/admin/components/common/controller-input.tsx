/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
// icons
import { Eye, EyeOff } from "lucide-react";
// plane internal packages
import { Input, InputGroup } from "@makeplane/propel/components/input";

// Generic over the form's values because react-hook-form's Control is invariant: its
// `_options.validate` narrows `name` to a keyof union, so `Control<any>` no longer
// accepts a typed form's control. Inferring from `control` keeps call sites unchanged.
type Props<TFieldValues extends FieldValues = FieldValues> = {
  control: Control<TFieldValues>;
  type: "text" | "password";
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string | React.ReactNode;
  placeholder: string;
  error: boolean;
  required: boolean;
};

export type TControllerInputFormField<TFieldValues extends FieldValues = FieldValues> = {
  key: FieldPath<TFieldValues>;
  type: "text" | "password";
  label: string;
  description?: string | React.ReactNode;
  placeholder: string;
  error: boolean;
  required: boolean;
};

export function ControllerInput<TFieldValues extends FieldValues = FieldValues>(props: Props<TFieldValues>) {
  const { name, control, type, label, description, placeholder, error, required } = props;
  // states
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-13 text-tertiary">{label}</h4>
      <InputGroup size="lg">
        <Controller
          control={control}
          name={name}
          rules={{ required: required ? `${label} is required.` : false }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              size="lg"
              id={name}
              name={name}
              type={type === "password" && showPassword ? "text" : type}
              value={value}
              onChange={onChange}
              ref={ref}
              aria-invalid={error}
              placeholder={placeholder}
            />
          )}
        />
        {type === "password" &&
          (showPassword ? (
            <button
              type="button"
              aria-label="Hide password"
              className="flex items-center justify-center text-placeholder"
              onClick={() => setShowPassword(false)}
            >
              <EyeOff className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Show password"
              className="flex items-center justify-center text-placeholder"
              onClick={() => setShowPassword(true)}
            >
              <Eye className="h-4 w-4" />
            </button>
          ))}
      </InputGroup>
      {description && <p className="pt-0.5 text-11 text-tertiary">{description}</p>}
    </div>
  );
}
