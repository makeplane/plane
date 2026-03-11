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

import { ApproverIcon, WorkflowIcon } from "@plane/propel/icons";

const LegendLine = ({ className }: { className: string }) => <div className={`h-0 w-24 ${className}`} />;

const LEGEND_ITEMS = [
  {
    icon: WorkflowIcon,
    label: "Transitions",
    lineClass: "border-primary border-t-1",
  },
  {
    icon: ApproverIcon,
    label: "Approval (approved)",
    lineClass: "border-success-strong border-t-2 border-dashed",
  },
  {
    icon: ApproverIcon,
    label: "Approval (declined)",
    lineClass: "border-danger-strong border-t-2 border-dashed",
  },
];

export const WorkflowRendererLegend = () => (
  <div className="rounded-md border border-subtle bg-surface-1 p-3 shadow-raised-100">
    {LEGEND_ITEMS.map(({ icon: Icon, label, lineClass }, idx) => (
      <div
        key={label}
        className={`${
          idx !== 0 ? "mt-2 " : ""
        }flex items-center justify-between gap-6 text-body-sm-regular text-secondary`}
      >
        <div className="flex items-center gap-2">
          <div className="bg-layer-2-selected p-1 rounded-sm">
            <Icon className="size-3.5 text-icon-secondary" />
          </div>
          <span className="text-caption-md-regular">{label}</span>
        </div>
        <LegendLine className={lineClass} />
      </div>
    ))}
  </div>
);
