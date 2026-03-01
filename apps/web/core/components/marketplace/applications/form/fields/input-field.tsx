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

import type { FieldValues, UseFormRegister } from "react-hook-form";
import { cn, Input } from "@plane/ui";
import type { BaseFieldProps } from "./base-field";
import { FieldWrapper } from "./base-field";

type Props<T extends FieldValues> = BaseFieldProps<T> & {
  type: "text" | "email" | "url";
  register: UseFormRegister<T>;
  onChange?: (value: string) => void;
};

export function InputField<T extends FieldValues>(props: Props<T>) {
  const { id, type, placeholder, disabled, tabIndex, error, className = "", register, validation, onChange } = props;

  return (
    <FieldWrapper {...props}>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={cn(`w-full resize-none text-13 bg-surface-1`, className)}
        hasError={Boolean(error)}
        disabled={disabled}
        tabIndex={tabIndex}
        {...register(id, {
          ...validation,
          onChange: (e) => onChange?.(e.target.value),
        })}
      />
    </FieldWrapper>
  );
}
