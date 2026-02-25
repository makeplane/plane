import { useMemo } from "react";
import type { ColumnDef, Row, RowData } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";

import type { AnalyticsTableDataMap, ModuleInsightColumns } from "@plane/types";

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

const ModulesInsightTable = observer(function ModulesInsightTable() {
    const params = useParams();
    const workspaceSlug = params.workspaceSlug.toString();
    const { t } = useTranslation();
    const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView, isEpic } = useAnalytics();

    const { data: modulesData, isLoading } = useSWR(
        `insights-table-modules-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}-${isEpic}`,
        () =>
            analyticsService.getAdvanceAnalyticsStats<ModuleInsightColumns[]>(
                workspaceSlug,
                "modules",
                {
                    ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
                    ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
                    ...(selectedModule ? { module_id: selectedModule } : {}),
                    ...(isEpic ? { epic: true } : {}),
                },
                isPeekView
            )
    );

    const columnsLabels: Record<keyof Omit<ModuleInsightColumns, "id" | "project_id">, string> = useMemo(
        () => ({
            name: t("common.module"),
            start_date: t("common.start_date"),
            target_date: t("common.target_date"),
            project__name: t("common.project"),
            lead__display_name: t("common.lead"),
            total_issues: t("common.work_items"),
            completed_issues: t("workspace_analytics.completed_issues_title"),
            completion_percent: t("common.progress"),
        }),
        [t]
    );

    const columns: ColumnDef<AnalyticsTableDataMap["modules"]>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: () => <div className="text-left">{columnsLabels["name"]}</div>,
                cell: ({ row }) => <div className="text-left font-medium">{row.original.name}</div>,
                meta: {
                    export: {
                        key: columnsLabels["name"],
                        value: (row) => row.original.name?.toString() ?? "",
                    },
                },
            },
            {
                accessorKey: "project__name",
                header: () => <div className="text-left">{columnsLabels["project__name"]}</div>,
                cell: ({ row }) => <div className="text-left">{row.original.project__name}</div>,
                meta: {
                    export: {
                        key: columnsLabels["project__name"],
                        value: (row) => row.original.project__name?.toString() ?? "",
                    },
                },
            },
            {
                accessorKey: "lead__display_name",
                header: () => <div className="text-left">{columnsLabels["lead__display_name"]}</div>,
                cell: ({ row }) => <div className="text-left">{row.original.lead__display_name ?? t("common.unassigned")}</div>,
                meta: {
                    export: {
                        key: columnsLabels["lead__display_name"],
                        value: (row) => row.original.lead__display_name?.toString() ?? "",
                    },
                },
            },
            {
                accessorKey: "start_date",
                header: () => <div className="text-right">{columnsLabels["start_date"]}</div>,
                cell: ({ row }) => <div className="text-right">{renderFormattedDate(new Date(row.original.start_date))}</div>,
                meta: {
                    export: {
                        key: columnsLabels["start_date"],
                        value: (row) => renderFormattedDate(new Date(row.original.start_date)) ?? "",
                    },
                },
            },
            {
                accessorKey: "target_date",
                header: () => <div className="text-right">{columnsLabels["target_date"]}</div>,
                cell: ({ row }) => <div className="text-right">{renderFormattedDate(new Date(row.original.target_date))}</div>,
                meta: {
                    export: {
                        key: columnsLabels["target_date"],
                        value: (row) => renderFormattedDate(new Date(row.original.target_date)) ?? "",
                    },
                },
            },
            {
                accessorKey: "total_issues",
                header: () => <div className="text-right">{columnsLabels["total_issues"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.total_issues}</div>,
                meta: {
                    export: {
                        key: columnsLabels["total_issues"],
                        value: (row) => row.original.total_issues.toString(),
                    },
                },
            },
            {
                accessorKey: "completed_issues",
                header: () => <div className="text-right">{columnsLabels["completed_issues"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.completed_issues}</div>,
                meta: {
                    export: {
                        key: columnsLabels["completed_issues"],
                        value: (row) => row.original.completed_issues.toString(),
                    },
                },
            },
            {
                accessorKey: "completion_percent",
                header: () => <div className="text-right">{columnsLabels["completion_percent"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.completion_percent}%</div>,
                meta: {
                    export: {
                        key: columnsLabels["completion_percent"],
                        value: (row) => row.original.completion_percent.toString() + "%",
                    },
                },
            },
        ],
        [columnsLabels, t]
    );

    return (
        <InsightTable<"modules">
            analyticsType="modules"
            data={modulesData}
            isLoading={isLoading}
            columns={columns}
            columnsLabels={columnsLabels as any}
            headerText={t("common.modules")}
            onExport={(rows) => modulesData && exportCSV(rows, columns, workspaceSlug)}
        />
    );
});

export default ModulesInsightTable;
