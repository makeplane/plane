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
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn } from "../utils/classname";

export interface IToggleSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}
const sizeClasses = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return { root: "h-4 w-7", thumb: "translate-x-3" };
    case "md":
      return { root: "h-5 w-9", thumb: "translate-x-4" };
    case "lg":
      return { root: "h-6 w-10", thumb: "translate-x-5" };
    default:
      return { root: "h-4 w-7", thumb: "translate-x-3" };
  }
};

function Switch({ value, onChange, label, size = "sm", disabled, className }: IToggleSwitchProps) {
  const sizeClass = sizeClasses(size);

  return (
    <BaseSwitch.Root
      checked={value}
      disabled={disabled}
      onCheckedChange={onChange}
      aria-label={label}
      className={cn(
        "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border border-subtle transition-colors",
        // size
        sizeClass.root,
        // state
        "bg-(--text-color-icon-placeholder)",
        "data-[checked]:bg-accent-primary",
        // disabled
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
    >
      {label && <span className="sr-only">{label}</span>}
      <BaseSwitch.Thumb
        aria-hidden="true"
        className={cn(
          "aspect-square h-full rounded-full shadow ring-0 transition-transform",
          "bg-(--text-color-icon-on-color)",
          // position by state
          value && sizeClass.thumb,
          // disabled
          "data-[disabled]:cursor-not-allowed"
        )}
      />
    </BaseSwitch.Root>
  );
}

Switch.displayName = "plane-ui-switch";

export { Switch };
