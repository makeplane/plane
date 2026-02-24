import { useMemo } from "react";
import type { ColumnDef, Row, RowData } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";

import type { AnalyticsTableDataMap, IntakeInsightColumns } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";

// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
import { AnalyticsService } from "@/services/analytics.service";
// plane web components
import { exportCSV } from "../export";
import { InsightTable } from "../insight-table/root";

const analyticsService = new AnalyticsService();

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        export: {
            key: string;
            value: (row: Row<TData>) => string | number;
            label?: string;
        };
    }
}

const IntakeInsightTable = observer(function IntakeInsightTable() {
    const params = useParams();
    const workspaceSlug = params.workspaceSlug.toString();
    const { t } = useTranslation();
    const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView, isEpic } = useAnalytics();

    const { data: intakeData, isLoading } = useSWR(
        `insights-table-intake-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}-${isEpic}`,
        () =>
            analyticsService.getAdvanceAnalyticsStats<IntakeInsightColumns[]>(
                workspaceSlug,
                "intake",
                {
                    ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
                    ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
                    ...(selectedModule ? { module_id: selectedModule } : {}),
                    ...(isEpic ? { epic: true } : {}),
                },
                isPeekView
            )
    );

    const columnsLabels: Record<keyof Omit<IntakeInsightColumns, "project_id">, string> = useMemo(
        () => ({
            project__name: t("common.project"),
            total_intakes: t("workspace_analytics.total_intakes_count"),
            accepted: t("workspace_analytics.status.accepted"),
            declined: t("workspace_analytics.status.declined"),
            duplicate: t("workspace_analytics.status.duplicate"),
        }),
        [t]
    );

    const columns: ColumnDef<AnalyticsTableDataMap["intake"]>[] = useMemo(
        () => [
            {
                accessorKey: "project__name",
                header: () => <div className="text-left">{columnsLabels["project__name"]}</div>,
                cell: ({ row }) => <div className="text-left font-medium max-w-sm truncate">{row.original.project__name}</div>,
                meta: {
                    export: {
                        key: columnsLabels["project__name"],
                        value: (row) => row.original.project__name?.toString() ?? "",
                    },
                },
            },
            {
                accessorKey: "total_intakes",
                header: () => <div className="text-right">{columnsLabels["total_intakes"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.total_intakes}</div>,
                meta: {
                    export: {
                        key: columnsLabels["total_intakes"],
                        value: (row) => row.original.total_intakes,
                    },
                },
            },
            {
                accessorKey: "accepted",
                header: () => <div className="text-right">{columnsLabels["accepted"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.accepted}</div>,
                meta: {
                    export: {
                        key: columnsLabels["accepted"],
                        value: (row) => row.original.accepted,
                    },
                },
            },
            {
                accessorKey: "declined",
                header: () => <div className="text-right">{columnsLabels["declined"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.declined}</div>,
                meta: {
                    export: {
                        key: columnsLabels["declined"],
                        value: (row) => row.original.declined,
                    },
                },
            },
            {
                accessorKey: "duplicate",
                header: () => <div className="text-right">{columnsLabels["duplicate"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.duplicate}</div>,
                meta: {
                    export: {
                        key: columnsLabels["duplicate"],
                        value: (row) => row.original.duplicate,
                    },
                },
            },
        ],
        [columnsLabels]
    );

    return (
        <InsightTable<"intake">
            analyticsType="intake"
            data={intakeData}
            isLoading={isLoading}
            columns={columns}
            columnsLabels={columnsLabels as any}
            headerText={t("common.intake")}
            onExport={(rows) => intakeData && exportCSV(rows, columns, workspaceSlug)}
        />
    );
});

export default IntakeInsightTable;
