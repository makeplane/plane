import { ColumnDef, Row } from "@tanstack/react-table";
import { download, generateCsv } from "export-to-csv";
import { csvConfig } from "./config";

export const exportCSV = <T>(rows: Row<T>[], columns: ColumnDef<T>[], workspaceSlug: string) => {
  const rowData = rows.map((row) => {
    const exportColumns = columns.map((col) => col.meta?.export).filter((v) => v != undefined);
    const cells = exportColumns.reduce((acc, col) => {
      const cell = col?.value(row) ?? "-";
      return { ...acc, [col?.label ?? col?.key]: cell };
    }, {});
    return cells;
  });
  const csv = generateCsv(csvConfig(workspaceSlug))(rowData);
  download(csvConfig(workspaceSlug))(csv);
};
