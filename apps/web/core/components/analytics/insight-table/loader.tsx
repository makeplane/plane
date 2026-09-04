/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@plane/propel/table";

interface TableSkeletonProps {
  columns: ColumnDef<any>[];
  rows: number;
}

export function TableLoader({ columns, rows }: TableSkeletonProps) {
  return (
    <Skeleton aria-label="Loading table">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={column.header?.toString() ?? index}>
                {typeof column.header === "string" ? column.header : ""}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <SkeletonItem blockSize="20px" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Skeleton>
  );
}
