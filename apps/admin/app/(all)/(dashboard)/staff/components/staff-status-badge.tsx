/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { cn } from "@plane/utils";
import type { IInstanceStaff } from "@plane/services";

type Props = {
  status: IInstanceStaff["employment_status"];
};

const STATUS_STYLES: Record<IInstanceStaff["employment_status"], string> = {
  active: "bg-success-subtle text-success-primary",
  probation: "bg-yellow-100 text-yellow-700",
  resigned: "bg-danger-subtle text-danger-primary",
  suspended: "bg-orange-100 text-orange-700",
  transferred: "bg-blue-100 text-blue-700",
};

const STATUS_LABELS: Record<IInstanceStaff["employment_status"], string> = {
  active: "Active",
  probation: "Probation",
  resigned: "Resigned",
  suspended: "Suspended",
  transferred: "Transferred",
};

export function StaffStatusBadge({ status }: Props) {
  return (
    <span className={cn("text-11 px-1.5 py-0.5 rounded font-medium capitalize", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}
