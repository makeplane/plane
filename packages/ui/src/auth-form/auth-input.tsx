/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";
import { Input } from "../form-fields/input";
import { cn } from "../utils";

export type TAuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
  errorClassName?: string;
};

const baseContainerClassName = "flex flex-col gap-1.5";

export function AuthInput({
  label,
  error,
  showPasswordToggle = false,
  errorClassName = "",
  className = "",
  type = "text",
  autoComplete = "off",
  ...props
}: TAuthInputProps) {
  const { id } = props;
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";

  const inputType = isPasswordType && showPasswordToggle && showPassword ? "text" : type;

  return (
    <div className={cn(baseContainerClassName)}>
      {label && (
        <label htmlFor={id} className={cn("text-13 font-semibold text-tertiary")}>
          {label}
        </label>
      )}
      <div className={cn("relative flex items-center rounded-md border border-strong py-2 px-3 transition-all")}>
        <Input
          {...props}
          type={inputType}
          autoComplete={autoComplete}
          className={cn(
            "rounded-md disable-autofill-style h-6 w-full placeholder:text-14 placeholder:text-placeholder p-0 border-none",
            {
              "border-danger-strong": error,
            },
            className
          )}
        />
        {showPasswordToggle && isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 h-5 w-5 stroke-placeholder hover:cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>

      {error && <p className={cn("text-13 text-danger-primary", errorClassName)}>{error}</p>}
    </div>
  );
}
