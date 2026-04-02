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

import { useMemo } from "react";
// plane imports
import { ChevronDownIcon, ReleaseIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type ReleaseButtonContentProps = {
  disabled: boolean;
  dropdownArrow: boolean;
  dropdownArrowClassName: string;
  hideIcon: boolean;
  hideText: boolean;
  placeholder?: string;
  showCount: boolean;
  value: string[];
  getReleaseById: (id: string) => { id: string; name: string } | undefined;
};

export function ReleaseButtonContent(props: ReleaseButtonContentProps) {
  const {
    disabled: _disabled,
    dropdownArrow,
    dropdownArrowClassName,
    hideIcon,
    hideText,
    placeholder,
    showCount,
    value,
    getReleaseById,
  } = props;

  const displayLabel = useMemo(() => {
    if (value.length === 0) return placeholder ?? "";
    if (value.length === 1) return getReleaseById(value[0])?.name ?? value[0];
    return `${value.length} Release${value.length === 1 ? "" : "s"}`;
  }, [value, placeholder, getReleaseById]);

  if (showCount) {
    return (
      <>
        <div className="relative flex items-center max-w-full gap-1">
          {!hideIcon && <ReleaseIcon className="h-3 w-3 shrink-0" />}
          {(value.length > 0 || !!placeholder) && !hideText && <div className="max-w-40 truncate">{displayLabel}</div>}
        </div>
        {dropdownArrow && (
          <ChevronDownIcon className={cn("h-2.5 w-2.5 shrink-0", dropdownArrowClassName)} aria-hidden="true" />
        )}
      </>
    );
  }

  return (
    <>
      {!hideIcon && <ReleaseIcon className="h-3 w-3 shrink-0" />}
      {!hideText && (
        <span className={cn("grow truncate text-left", value.length === 0 && "text-placeholder")}>{displayLabel}</span>
      )}
      {dropdownArrow && (
        <ChevronDownIcon className={cn("h-2.5 w-2.5 shrink-0", dropdownArrowClassName)} aria-hidden="true" />
      )}
    </>
  );
}
