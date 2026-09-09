/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@makeplane/propel/components/table";
import { Loader } from "@plane/blocks/loader";

interface TableSkeletonProps {
  columns: ColumnDef<any>[];
  rows: number;
}

export function TableLoader({ columns, rows }: TableSkeletonProps) {
  return (
    <Table variant="table">
      <TableHeader>
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={column.header?.toString() ?? index}
              pinned="none"
              label={typeof column.header === "string" ? column.header : ""}
            />
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((_, colIndex) => (
              <TableCell key={colIndex} pinned="none" padding="cell">
                <Loader.Item height="20px" width="100%" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
