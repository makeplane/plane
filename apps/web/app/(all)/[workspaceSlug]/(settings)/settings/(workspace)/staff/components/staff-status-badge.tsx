/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  probation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  resigned: "bg-surface-2 text-color-tertiary border-color-subtle",
  suspended: "bg-red-500/10 text-red-600 border-red-500/20",
  transferred: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

interface StaffStatusBadgeProps {
  status: string;
}

/** Renders a colored badge for the staff employment status. */
export const StaffStatusBadge = ({ status }: StaffStatusBadgeProps) => (
  <span
    className={cn(
      "inline-flex rounded-full border px-2 py-1 text-xs font-medium capitalize",
      STATUS_COLORS[status] || ""
    )}
  >
    {status}
  </span>
);
