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

import React from "react";
import type { LucideIcon } from "lucide-react";
import { TableCell, TableRow } from "@plane/propel/table";

interface TableEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  colSpan: number;
  className?: string;
}

export function TableEmptyState({ icon: Icon, title, description, colSpan, className = "" }: TableEmptyStateProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className={`h-32 text-center ${className}`}>
        <div className="flex flex-col items-center justify-center text-placeholder">
          {Icon && <Icon className="h-8 w-8 mb-2 opacity-50" />}
          <p className="text-13 font-medium">{title}</p>
          {description && <p className="text-11 text-placeholder mt-1">{description}</p>}
        </div>
      </TableCell>
    </TableRow>
  );
}
