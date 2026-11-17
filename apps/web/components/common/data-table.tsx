/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment } from "react";
import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@makeplane/propel/components/table";
import type { TableRowProps, TableVariant } from "@makeplane/propel/components/table";
import { TableHead as TableHeadElement } from "@makeplane/propel/elements/table";
import { Loader } from "@plane/blocks/skeleton";

export type DataTableColumn<T> = {
  key: string;
  /** Column title. The header label unless `thRender` supplies richer content. */
  content: string;
  /**
   * Custom header content (a sort menu, a right-aligned numeric title). Rendered through the
   * elements-tier `TableHead`, which takes children; the ready-made one takes a string label only.
   */
  thRender?: () => ReactNode;
  tdRender: (rowData: T) => ReactNode;
  /**
   * Cell padding mode. `cell` (default) is propel's `px-3 py-2` text cell. `trigger` drops the
   * cell's own padding so a full-height control can own the box — without it, a control offset
   * into the cell's gutter is clipped by the content region's `truncate`.
   */
  padding?: "cell" | "trigger";
};

/** Row attributes: the `<tr>` props propel forwards, plus `data-*` flags a wrapping selector can style. */
export type DataTableRowProps = Omit<TableRowProps, "children" | "render"> &
  Record<`data-${string}`, string | undefined>;

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (rowData: T) => string;
  /**
   * Wraps a row. Receives the rendered cells and must return them inside a `TableRow` (the caller
   * owns the row when it needs a `render`, an id, or event handlers on it).
   */
  renderRow?: (props: { rowData: T; children: ReactNode }) => ReactNode;
  /** Attributes for a row, e.g. a `data-*` flag a wrapping selector can style (dimmed rows). */
  getRowProps?: (rowData: T) => DataTableRowProps;
  /** Replaces the body with three skeleton rows. */
  isLoading?: boolean;
  /** `table` draws row dividers only; `spreadsheet` draws the full grid. @default "table" */
  variant?: TableVariant;
};

/**
 * The `columns` / `data` / `keyExtractor` table of the legacy `@plane/blocks/tables` `Table`, rendered with
 * propel's table parts. Chrome (dividers, header fill, cell padding, the rounded scroll frame) is
 * propel's; there is no className axis. Headers are `TableHead label` unless a column brings its
 * own `thRender`, and every cell is `TableCell padding="cell"` unless the column opts into
 * `padding: "trigger"`.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const { columns, data, keyExtractor, renderRow, getRowProps, isLoading = false, variant = "table" } = props;

  return (
    <Table variant={variant}>
      <TableHeader>
        <TableRow>
          {columns.map((column) =>
            column.thRender ? (
              <TableHeadElement key={column.key} variant={variant} pinned="none">
                {column.thRender()}
              </TableHeadElement>
            ) : (
              <TableHead key={column.key} label={column.content} pinned="none" />
            )
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell pinned="none" padding="cell" colSpan={columns.length}>
              <Loader className="flex flex-col gap-2 py-2">
                <Loader.Item height="28px" width="100%" />
                <Loader.Item height="28px" width="100%" />
                <Loader.Item height="28px" width="100%" />
              </Loader>
            </TableCell>
          </TableRow>
        ) : (
          data.map((rowData) => {
            const key = keyExtractor(rowData);
            const cells = columns.map((column) => (
              <TableCell key={`${column.key}-${key}`} pinned="none" padding={column.padding ?? "cell"}>
                {column.tdRender(rowData)}
              </TableCell>
            ));
            if (renderRow) return <Fragment key={key}>{renderRow({ rowData, children: cells })}</Fragment>;
            return (
              <TableRow key={key} {...getRowProps?.(rowData)}>
                {cells}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
