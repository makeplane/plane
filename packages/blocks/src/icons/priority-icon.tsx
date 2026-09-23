/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { cn } from "@plane/utils";
import { PriorityUrgent, PriorityNone, PriorityHigh, PriorityLow, PriorityMedium } from "@makeplane/propel/icons";

export type IssuePriority = "urgent" | "high" | "medium" | "low" | "none";

/** @deprecated Use IssuePriority instead. */
export type TIssuePriorities = IssuePriority;

export type PriorityIconProps = {
  className?: string;
  priority: IssuePriority | undefined | null;
};

/** @deprecated Use PriorityIconProps instead. */
export type IPriorityIcon = PriorityIconProps;

export function PriorityIcon(props: PriorityIconProps) {
  const { priority, className = "size-3.5" } = props;

  // get priority icon
  const icons = {
    urgent: PriorityUrgent,
    high: PriorityHigh,
    medium: PriorityMedium,
    low: PriorityLow,
    none: PriorityNone,
  };
  const Icon = icons[priority ?? "none"];

  if (!Icon) return null;

  return (
    <Icon
      className={cn(
        "shrink-0",
        {
          "text-priority-urgent": priority === "urgent",
          "text-priority-high": priority === "high",
          "text-priority-medium": priority === "medium",
          "text-priority-low": priority === "low",
          "text-priority-none": priority === "none",
        },
        className
      )}
    />
  );
}
