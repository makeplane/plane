/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { CustomSelect } from "@plane/ui";

type TProps<T extends string | number> = {
  value: T;
  onChange: (value: T) => void;
  label: ReactNode;
  children: ReactNode;
  disabled?: boolean;
};

export function ProjectTemplateSelectField<T extends string | number>({
  value,
  onChange,
  label,
  children,
  disabled = false,
}: TProps<T>) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      disabled={disabled}
      input
      className="w-full"
      buttonClassName="h-8 w-full min-h-8 bg-surface-1 text-13 text-primary"
      label={<span className="block min-w-0 flex-1 truncate text-left text-primary">{label}</span>}
      maxHeight="md"
    >
      {children}
    </CustomSelect>
  );
}
