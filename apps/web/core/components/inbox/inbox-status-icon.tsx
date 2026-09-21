/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  ClockOutline,
  CloseCircleOutline,
  CopyOutline,
  TickCircleOutline,
  WarningTriangleOutline,
} from "@makeplane/propel/icons";
import type { TInboxIssueStatus } from "@plane/types";
import { EInboxIssueStatus } from "@plane/types";
import { cn } from "@plane/utils";

export const ICON_PROPERTIES = {
  [EInboxIssueStatus.PENDING]: {
    icon: WarningTriangleOutline,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-warning-primary"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-warning-subtle"),
  },
  [EInboxIssueStatus.DECLINED]: {
    icon: CloseCircleOutline,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-danger-primary"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-danger-subtle"),
  },
  [EInboxIssueStatus.SNOOZED]: {
    icon: ClockOutline,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "text-danger-primary" : "text-placeholder"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "bg-danger-subtle" : "bg-layer-3"),
  },
  [EInboxIssueStatus.ACCEPTED]: {
    icon: TickCircleOutline,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-success-primary"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-success-subtle"),
  },
  [EInboxIssueStatus.DUPLICATE]: {
    icon: CopyOutline,
    textColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "text-secondary"),
    bgColor: (snoozeDatePassed: boolean = false) => (snoozeDatePassed ? "" : "bg-layer-3"),
  },
};
export function InboxStatusIcon({
  type,
  size,
  className,
  renderColor = true,
}: {
  type: TInboxIssueStatus;
  size?: number;
  className?: string;
  renderColor?: boolean;
}) {
  if (type === undefined) return null;
  const Icon = ICON_PROPERTIES[type];
  if (!Icon) return null;
  return (
    <Icon.icon
      width={size}
      height={size}
      className={cn(`h-3 w-3 ${renderColor && Icon?.textColor(false)}`, className)}
    />
  );
}
