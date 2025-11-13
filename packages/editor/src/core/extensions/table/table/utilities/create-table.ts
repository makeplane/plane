import type { Fragment, Node as ProsemirrorNode, Schema } from "@tiptap/pm/model";
// extensions
import { createCell } from "@/extensions/table/table/utilities/create-cell";
import { getTableNodeTypes } from "@/extensions/table/table/utilities/get-table-node-types";

type Props = {
  schema: Schema;
  rowsCount: number;
  colsCount: number;
  withHeaderRow: boolean;
  cellContent?: Fragment | ProsemirrorNode | Array<ProsemirrorNode>;
  columnWidth: number;
};

export const createTable = (props: Props): ProsemirrorNode => {
  const { schema, rowsCount, colsCount, withHeaderRow, cellContent, columnWidth } = props;

  const types = getTableNodeTypes(schema);
  const headerCells: ProsemirrorNode[] = [];
  const cells: ProsemirrorNode[] = [];

  for (let index = 0; index < colsCount; index += 1) {
    const cell = createCell(types.cell, cellContent, { colwidth: [columnWidth] });

    if (cell) {
      cells.push(cell);
    }

    if (withHeaderRow) {
      const headerCell = createCell(types.header_cell, cellContent, { colwidth: [columnWidth] });

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
};
