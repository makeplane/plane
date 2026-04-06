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

import { useState } from "react";
import type { ReactNode } from "react";
import { DropdownIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

export type EntityDetailSidebarGroupProps = {
  label: string;
  children: ReactNode;
} & (
  | { isOpen: boolean; onToggle: () => void; defaultOpen?: never }
  | { isOpen?: undefined; onToggle?: undefined; defaultOpen?: boolean }
);

export function EntityDetailSidebarGroup(props: EntityDetailSidebarGroupProps) {
  const { label, children } = props;
  const [internalOpen, setInternalOpen] = useState(props.defaultOpen ?? true);

  const isControlled = props.isOpen !== undefined;
  const open = isControlled ? props.isOpen : internalOpen;
  const handleToggle = isControlled ? props.onToggle : () => setInternalOpen((p) => !p);

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="flex w-full items-center gap-1 py-1 text-caption-md-semibold text-primary"
        onClick={handleToggle}
        aria-expanded={open}
      >
        <span className="text-caption-md-semibold">{label}</span>
        <div className="flex items-center justify-center size-4">
          <DropdownIcon
            className={cn("size-42 text-primary transition-transform duration-200 self-center", {
              "-rotate-90": !open,
            })}
          />
        </div>
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}
