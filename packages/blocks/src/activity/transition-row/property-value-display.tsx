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

import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import type { PropertyValue } from "../types";

type PropertyValueDisplayProps = {
  value: PropertyValue;
  variant: "old" | "new";
};

export function PropertyValueDisplay(props: PropertyValueDisplayProps) {
  const { value, variant } = props;

  return (
    <div className="flex items-center gap-1.5 rounded-md py-1">
      <Tooltip tooltipContent={variant === "old" ? `Changed from ${value.label}` : `Updated to ${value.label}`}>
        <div className="flex items-center gap-1">
          {value.icon && (
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center",
                value.isEmpty ? "text-secondary" : variant === "old" ? "text-secondary" : ""
              )}
            >
              {value.icon}
            </span>
          )}

          <span
            className={cn(
              "whitespace-nowrap truncate max-w-28",
              variant === "new" ? "text-body-xs-medium text-primary" : "text-body-xs-regular text-secondary",
              value.isEmpty && "text-secondary"
            )}
          >
            {value.label}
          </span>
        </div>
      </Tooltip>
      {value.badge}
    </div>
  );
}
