import { ColumnDef, Row, Table } from "@tanstack/react-table";
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
  onExport?: (rows: Row<AnalyticsTableDataMap[T]>[]) => void;
}

export const InsightTable = <T extends Exclude<TAnalyticsTabsBase, "overview">>(
  props: InsightTableProps<T>
): React.ReactElement => {
  const { data, isLoading, columns, headerText, onExport } = props;
  const { t } = useTranslation();
  if (isLoading) {
    return <TableLoader columns={columns} rows={5} />;
  }

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
              onClick={() => onExport?.(table.getFilteredRowModel().rows)}
            >
              <div>{t("exporter.csv.short_description")}</div>
            </Button>
          )}
        />
      ) : (
        <div>{t("common.no_data_yet")}</div>
      )}
    </div>
  );
};
