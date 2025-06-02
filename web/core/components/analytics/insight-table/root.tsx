import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { download, generateCsv, mkConfig } from "export-to-csv";
import { useParams } from "next/navigation";
import { Download } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { AnalyticsTableDataMap, TAnalyticsTabsBase } from "@plane/types";
import { Button } from "@plane/ui";
import { DataTable } from "./data-table";
import { TableLoader } from "./loader";
interface InsightTableProps<T extends Exclude<TAnalyticsTabsBase, "overview">> {
  analyticsType: T;
  data?: AnalyticsTableDataMap[T][];
  isLoading?: boolean;
  columns: ColumnDef<AnalyticsTableDataMap[T]>[];
  columnsLabels?: Record<string, string>;
  headerText: string;
}

export const InsightTable = <T extends Exclude<TAnalyticsTabsBase, "overview">>(
  props: InsightTableProps<T>
): React.ReactElement => {
  const { data, isLoading, columns, columnsLabels, headerText } = props;
  const params = useParams();
  const { t } = useTranslation();
  const workspaceSlug = params.workspaceSlug.toString();
  if (isLoading) {
    return <TableLoader columns={columns} rows={5} />;
  }

  const csvConfig = mkConfig({
    fieldSeparator: ",",
    filename: `${workspaceSlug}-analytics`,
    decimalSeparator: ".",
    useKeysAsHeaders: true,
  });

  const exportCSV = (rows: Row<AnalyticsTableDataMap[T]>[]) => {
    const rowData: any = rows.map((row) => {
      const { project_id, avatar_url, assignee_id, ...exportableData } = row.original;
      return Object.fromEntries(
        Object.entries(exportableData).map(([key, value]) => {
          if (columnsLabels?.[key]) {
            return [columnsLabels[key], value];
          }
          return [key, value];
        })
      );
    });
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  return (
    <div className="">
      {data ? (
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder={`${data.length} ${headerText}`}
          actions={(table: Table<AnalyticsTableDataMap[T]>) => (
            <Button
              variant="accent-primary"
              prependIcon={<Download className="h-3.5 w-3.5" />}
              onClick={() => exportCSV(table.getFilteredRowModel().rows)}
            >
              <div>{t("exporter.csv.short_description")}</div>
            </Button>
          )}
        />
      ) : (
        <div>No data</div>
      )}
    </div>
  );
};
