import { ColumnDef } from "@tanstack/react-table";
import { AnalyticsTableDataMap, TAnalyticsTabsV2Base } from "@plane/types";
import { DataTable } from "./data-table";
import { TableLoader } from "./loader";


interface InsightTableProps<T extends Exclude<TAnalyticsTabsV2Base, "overview">> {
    analyticsType: T;
    data?: AnalyticsTableDataMap[T][];
    isLoading?: boolean;
    columns: ColumnDef<AnalyticsTableDataMap[T]>[];
}

export const InsightTable = <T extends Exclude<TAnalyticsTabsV2Base, "overview">>(
    props: InsightTableProps<T>
): React.ReactElement => {
    const { analyticsType, data, isLoading, columns } = props

    if (isLoading) {
        return <TableLoader columns={columns} rows={5} />
    }
    return (
        <div className="">
            {data ? <DataTable
                columns={columns}
                data={data}
                searchPlaceholder={`${data.length} Projects`}
            /> : <div>No data</div>}
        </div>
    );
};

