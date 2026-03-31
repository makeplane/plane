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

import { cn } from "@plane/utils";
import type { PropertyValue } from "../types";

type PropertyValueDisplayProps = {
  value: PropertyValue;
  variant: "old" | "new";
};

export function PropertyValueDisplay(props: PropertyValueDisplayProps) {
  const { value, variant } = props;

  return (
    <div className="flex items-center gap-2">
      <span className="text-body-xs-regular text-placeholder">{variant === "old" ? "Old" : "New"}</span>
      <div className="flex items-center gap-1.5 rounded-md py-1">
        {value.icon && <span className="flex size-4 shrink-0 items-center justify-center">{value.icon}</span>}
        <span
          className={cn(
            "whitespace-nowrap",
            variant === "new" ? "text-body-xs-medium text-primary" : "text-body-xs-regular text-secondary",
            value.isEmpty && "text-placeholder"
          )}
        >
          {value.label}
        </span>
        {value.badge}
      </div>
    </div>
  );
}
