import { useMemo } from "react";
import type { ColumnDef, Row, RowData } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { UserRound } from "lucide-react";
import { useTranslation } from "@plane/i18n";

import type { AnalyticsTableDataMap, UserInsightColumns } from "@plane/types";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";

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

const UsersInsightTable = observer(function UsersInsightTable() {
    const params = useParams();
    const workspaceSlug = params.workspaceSlug.toString();
    const { t } = useTranslation();
    const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView, isEpic } = useAnalytics();

    const { data: usersData, isLoading } = useSWR(
        `insights-table-users-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}-${isEpic}`,
        () =>
            analyticsService.getAdvanceAnalyticsStats<UserInsightColumns[]>(
                workspaceSlug,
                "users",
                {
                    ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
                    ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
                    ...(selectedModule ? { module_id: selectedModule } : {}),
                    ...(isEpic ? { epic: true } : {}),
                },
                isPeekView
            )
    );

    const columnsLabels: Record<keyof Omit<UserInsightColumns, "assignee_id" | "avatar_url">, string> = useMemo(
        () => ({
            display_name: t("common.assignee"),
            started_work_items: t("workspace_analytics.started"),
            completed_work_items: t("workspace_analytics.completed"),
            un_started_work_items: t("workspace_analytics.unstarted"),
        }),
        [t]
    );

    const columns: ColumnDef<AnalyticsTableDataMap["users"]>[] = useMemo(
        () => [
            {
                accessorKey: "display_name",
                header: () => <div className="text-left">{columnsLabels["display_name"]}</div>,
                cell: ({ row }) => (
                    <div className="text-left">
                        <div className="flex items-center gap-2">
                            {row.original.avatar_url && row.original.avatar_url !== "" ? (
                                <Avatar
                                    name={row.original.display_name}
                                    src={getFileURL(row.original.avatar_url)}
                                    size={24}
                                    shape="circle"
                                />
                            ) : (
                                <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-layer-1 capitalize overflow-hidden">
                                    {row.original.display_name ? (
                                        row.original.display_name?.[0]
                                    ) : (
                                        <UserRound className="text-secondary" size={12} />
                                    )}
                                </div>
                            )}
                            <span className="break-words text-secondary">{row.original.display_name ?? t("common.unassigned")}</span>
                        </div>
                    </div>
                ),
                meta: {
                    export: {
                        key: columnsLabels["display_name"],
                        value: (row) => row.original.display_name?.toString() ?? "",
                    },
                },
            },
            {
                accessorKey: "started_work_items",
                header: () => <div className="text-right">{columnsLabels["started_work_items"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.started_work_items}</div>,
                meta: {
                    export: {
                        key: columnsLabels["started_work_items"],
                        value: (row) => row.original.started_work_items.toString(),
                    },
                },
            },
            {
                accessorKey: "completed_work_items",
                header: () => <div className="text-right">{columnsLabels["completed_work_items"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.completed_work_items}</div>,
                meta: {
                    export: {
                        key: columnsLabels["completed_work_items"],
                        value: (row) => row.original.completed_work_items.toString(),
                    },
                },
            },
            {
                accessorKey: "un_started_work_items",
                header: () => <div className="text-right">{columnsLabels["un_started_work_items"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.un_started_work_items}</div>,
                meta: {
                    export: {
                        key: columnsLabels["un_started_work_items"],
                        value: (row) => row.original.un_started_work_items.toString(),
                    },
                },
            },
        ],
        [columnsLabels, t]
    );

    return (
        <InsightTable<"users">
            analyticsType="users"
            data={usersData}
            isLoading={isLoading}
            columns={columns}
            columnsLabels={columnsLabels as any}
            headerText={t("common.users")}
            onExport={(rows) => usersData && exportCSV(rows, columns, workspaceSlug)}
        />
    );
});

export default UsersInsightTable;
