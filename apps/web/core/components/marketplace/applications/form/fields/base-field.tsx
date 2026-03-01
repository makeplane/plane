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

import type { FieldError, FieldValues, Path, RegisterOptions } from "react-hook-form";

export type BaseFieldProps<T extends FieldValues> = {
  id: Path<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  tabIndex?: number;
  error?: FieldError;
  className?: string;
  validation?: RegisterOptions<T>;
};

export function FieldWrapper<T extends FieldValues>({
  label,
  description,
  error,
  validation,
  children,
}: BaseFieldProps<T> & { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="text-11 text-primary font-medium gap-1">
          {label}
          <span className="text-danger-primary">{validation?.required && <sup>*</sup>}</span>
        </div>
      )}
      {description && <div className="text-11 text-tertiary">{description}</div>}
      {children}
      {error && <p className="text-danger-primary text-11">{error.message}</p>}
    </div>
  );
}
