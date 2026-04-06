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
import type { AuditRow } from "../types";

export type EntityDetailAuditInfoProps = {
  rows: AuditRow[];
  className?: string;
};

export function EntityDetailAuditInfo(props: EntityDetailAuditInfoProps) {
  const { rows, className } = props;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {rows.map((row) => (
        <div key={row.text} className="flex gap-2 items-center rounded py-1">
          <row.icon className="size-3.5 shrink-0 text-placeholder" />
          <span className="text-caption-md-regular text-placeholder">{row.text}</span>
        </div>
      ))}
    </div>
  );
}
