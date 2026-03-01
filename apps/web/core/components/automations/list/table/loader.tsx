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

import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@plane/propel/table";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";

const COMMON_TABLE_HEADER_CLASSNAME = "h-14 text-center";
const COMMON_TABLE_TITLE_HEADER_CLASSNAME = "h-14 sticky left-0 bg-surface-1 border-r border-subtle z-10 min-w-[200px]";
const COMMON_TABLE_CELL_CLASSNAME = "text-secondary text-center";
const COMMON_TABLE_TITLE_CELL_CLASSNAME =
  "font-medium text-primary max-w-72 truncate sticky left-0 bg-surface-1 border-r border-subtle z-10 min-w-[200px] transition-colors duration-75 py-3";

export function AutomationsTableLoader() {
  return (
    <Loader className="space-y-4">
      {/* Table */}
      <div>
        <Table className="min-w-[1000px]">
          <TableHeader className="bg-surface-1 border-t-0 border-subtle py-4">
            <TableRow>
              <TableHead className={COMMON_TABLE_TITLE_HEADER_CLASSNAME}>
                <Loader.Item height="16px" width="120px" />
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                <Loader.Item height="16px" width="100px" />
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                <Loader.Item height="16px" width="90px" />
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                <Loader.Item height="16px" width="110px" />
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                <Loader.Item height="16px" width="60px" />
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                <Loader.Item height="16px" width="100px" />
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                <Loader.Item height="16px" width="80px" />
              </TableHead>
              <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "text-center")}>
                <Loader.Item height="16px" width="80px" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index} className="border-b border-subtle transition-colors duration-75">
                {/* Automation title */}
                <TableCell className={COMMON_TABLE_TITLE_CELL_CLASSNAME}>
                  <div className="flex items-center gap-2.5 truncate">
                    <Loader.Item height="20px" width="180px" />
                  </div>
                </TableCell>
                {/* Last run on */}
                <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                  <Loader.Item height="16px" width="80px" />
                </TableCell>
                {/* Created on */}
                <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                  <Loader.Item height="16px" width="90px" />
                </TableCell>
                {/* Last updated on */}
                <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                  <Loader.Item height="16px" width="90px" />
                </TableCell>
                {/* Last run status */}
                <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                  <Loader.Item height="24px" width="60px" className="rounded-md" />
                </TableCell>
                {/* Average duration */}
                <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                  <Loader.Item height="16px" width="80px" />
                </TableCell>
                {/* Owner */}
                <TableCell className={cn(COMMON_TABLE_CELL_CLASSNAME, "grid place-items-center")}>
                  <Loader.Item height="16px" width="16px" className="rounded-full" />
                </TableCell>
                {/* Executions */}
                <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                  <Loader.Item height="16px" width="40px" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Loader>
  );
}
