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

import React, { useState } from "react";
// icons
import { Eye, EyeOff } from "lucide-react";
// ui
import { Input } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";

type Props = {
  type: "text" | "password";
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string | React.ReactNode;
  placeholder: string;
  error: boolean;
};

export type TAuthFormInputFormField = {
  key: string;
  type: "text" | "password";
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: string | React.ReactNode;
  placeholder: string;
  error: boolean;
};

export function AuthFormInput(props: Props) {
  const { name, type, label, description, placeholder, error, value, onChange } = props;
  // states
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-13 text-tertiary">{label}</h4>
      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type === "password" && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          hasError={error}
          placeholder={placeholder}
          className={cn("w-full rounded-md font-medium", {
            "pr-10": type === "password",
          })}
          autoComplete="off"
        />
        {type === "password" &&
          (showPassword ? (
            <button
              tabIndex={-1}
              className="absolute right-3 top-2.5 flex items-center justify-center text-placeholder"
              onClick={() => setShowPassword(false)}
            >
              <EyeOff className="h-4 w-4" />
            </button>
          ) : (
            <button
              tabIndex={-1}
              className="absolute right-3 top-2.5 flex items-center justify-center text-placeholder"
              onClick={() => setShowPassword(true)}
            >
              <Eye className="h-4 w-4" />
            </button>
          ))}
      </div>
      {description && <p className="pt-0.5 text-11 text-tertiary">{description}</p>}
    </div>
  );
}
