/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import * as React from "react";
import { Input as BaseInput } from "@base-ui/react/input";
// helpers
import { cn } from "../utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mode?: "primary" | "transparent" | "true-transparent";
  inputSize?: "xs" | "sm" | "md";
  hasError?: boolean;
  prependIcon?: React.ReactNode;
  appendIcon?: React.ReactNode;
}

const Input = React.forwardRef(function Input(props: InputProps, ref: React.ForwardedRef<HTMLInputElement>) {
  const {
    id,
    type,
    name,
    mode = "primary",
    inputSize = "sm",
    hasError = false,
    className = "",
    autoComplete = "off",
    ...rest
  } = props;

  return (
    <div
      className={cn("flex items-center bg-layer-2 text-13 placeholder-tertiary focus-within:outline-none", {
        "rounded-md border-[0.5px] border-subtle-1": mode === "primary",
        "rounded-sm border-none bg-transparent ring-0 transition-all focus-within:ring-1 focus-within:ring-accent-strong":
          mode === "transparent",
        "rounded-sm border-none bg-transparent ring-0": mode === "true-transparent",
        "border-danger-strong": hasError,
      })}
    >
      {props.prependIcon && <span className="flex items-center pl-2 text-tertiary">{props.prependIcon}</span>}

      <BaseInput
        id={id}
        ref={ref}
        type={type}
        name={name}
        className={cn(
          "w-full bg-transparent focus:outline-none",
          {
            "px-1.5 py-1": inputSize === "xs",
            "px-3 py-2": inputSize === "sm",
            "p-3": inputSize === "md",
          },
          className
        )}
        aria-invalid={hasError || undefined}
        autoComplete={autoComplete}
        {...rest}
      />

      {props.appendIcon && <span className="flex items-center pr-2 text-tertiary">{props.appendIcon}</span>}
    </div>
  );
});

Input.displayName = "form-input-field";

export { Input };
