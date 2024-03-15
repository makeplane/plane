import { Fragment, Node as ProsemirrorNode, Schema } from "@tiptap/pm/model";

import { createCell } from "src/ui/extensions/table/table/utilities/create-cell";
import { getTableNodeTypes } from "src/ui/extensions/table/table/utilities/get-table-node-types";

export function createTable(
  schema: Schema,
  rowsCount: number,
  colsCount: number,
  withHeaderRow: boolean,
  cellContent?: Fragment | ProsemirrorNode | Array<ProsemirrorNode>
): ProsemirrorNode {
  const types = getTableNodeTypes(schema);
  const headerCells: ProsemirrorNode[] = [];
  const cells: ProsemirrorNode[] = [];

  for (let index = 0; index < colsCount; index += 1) {
    const cell = createCell(types.cell, cellContent);

    if (cell) {
      cells.push(cell);
    }

    if (withHeaderRow) {
      const headerCell = createCell(types.header_cell, cellContent);

      if (headerCell) {
        headerCells.push(headerCell);
      }
    }
  }

  const rows: ProsemirrorNode[] = [];

  for (let index = 0; index < rowsCount; index += 1) {
    rows.push(types.row.createChecked(null, withHeaderRow && index === 0 ? headerCells : cells));
  }

  return types.table.createChecked(null, rows);
}
