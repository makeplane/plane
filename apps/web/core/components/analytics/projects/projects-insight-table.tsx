import { useMemo } from "react";
import type { ColumnDef, Row, RowData } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";

import type { AnalyticsTableDataMap, ProjectInsightColumns } from "@plane/types";

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

const ProjectsInsightTable = observer(function ProjectsInsightTable() {
    const params = useParams();
    const workspaceSlug = params.workspaceSlug.toString();
    const { t } = useTranslation();
    const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView, isEpic } = useAnalytics();

    const { data: projectsData, isLoading } = useSWR(
        `insights-table-projects-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}-${isEpic}`,
        () =>
            analyticsService.getAdvanceAnalyticsStats<ProjectInsightColumns[]>(
                workspaceSlug,
                "projects",
                {
                    ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
                    ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
                    ...(selectedModule ? { module_id: selectedModule } : {}),
                    ...(isEpic ? { epic: true } : {}),
                },
                isPeekView
            )
    );

    const columnsLabels: Record<keyof Omit<ProjectInsightColumns, "project_id" | "state_groups"> | "started" | "completed" | "backlog" | "unstarted" | "cancelled", string> = useMemo(
        () => ({
            project__name: t("common.project"),
            members: t("common.members"),
            work_items: t("common.work_items"),
            started: t("workspace_projects.state.started"),
            completed: t("workspace_projects.state.completed"),
            backlog: t("workspace_projects.state.backlog"),
            unstarted: t("workspace_projects.state.unstarted"),
            cancelled: t("workspace_projects.state.cancelled"),
        }),
        [t]
    );

    const columns: ColumnDef<AnalyticsTableDataMap["projects"]>[] = useMemo(
        () => [
            {
                accessorKey: "project__name",
                header: () => <div className="text-left">{columnsLabels["project__name"]}</div>,
                cell: ({ row }) => <div className="text-left font-medium">{row.original.project__name}</div>,
                meta: {
                    export: {
                        key: columnsLabels["project__name"],
                        value: (row) => row.original.project__name?.toString() ?? "",
                    },
                },
            },
            {
                accessorKey: "members",
                header: () => <div className="text-right">{columnsLabels["members"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.members}</div>,
                meta: {
                    export: {
                        key: columnsLabels["members"],
                        value: (row) => row.original.members.toString(),
                    },
                },
            },
            {
                accessorKey: "work_items",
                header: () => <div className="text-right">{columnsLabels["work_items"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.work_items}</div>,
                meta: {
                    export: {
                        key: columnsLabels["work_items"],
                        value: (row) => row.original.work_items.toString(),
                    },
                },
            },
            {
                id: "started",
                header: () => <div className="text-right">{columnsLabels["started"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.state_groups.started}</div>,
                meta: {
                    export: {
                        key: columnsLabels["started"],
                        value: (row) => row.original.state_groups.started.toString(),
                    },
                },
            },
            {
                id: "completed",
                header: () => <div className="text-right">{columnsLabels["completed"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.state_groups.completed}</div>,
                meta: {
                    export: {
                        key: columnsLabels["completed"],
                        value: (row) => row.original.state_groups.completed.toString(),
                    },
                },
            },
            {
                id: "backlog",
                header: () => <div className="text-right">{columnsLabels["backlog"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.state_groups.backlog}</div>,
                meta: {
                    export: {
                        key: columnsLabels["backlog"],
                        value: (row) => row.original.state_groups.backlog.toString(),
                    },
                },
            },
            {
                id: "unstarted",
                header: () => <div className="text-right">{columnsLabels["unstarted"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.state_groups.unstarted}</div>,
                meta: {
                    export: {
                        key: columnsLabels["unstarted"],
                        value: (row) => row.original.state_groups.unstarted.toString(),
                    },
                },
            },
            {
                id: "cancelled",
                header: () => <div className="text-right">{columnsLabels["cancelled"]}</div>,
                cell: ({ row }) => <div className="text-right">{row.original.state_groups.cancelled}</div>,
                meta: {
                    export: {
                        key: columnsLabels["cancelled"],
                        value: (row) => row.original.state_groups.cancelled.toString(),
                    },
                },
            },
        ],
        [columnsLabels]
    );

    return (
        <InsightTable<"projects">
            analyticsType="projects"
            data={projectsData}
            isLoading={isLoading}
            columns={columns}
            columnsLabels={columnsLabels as any}
            headerText={t("common.projects")}
            onExport={(rows) => projectsData && exportCSV(rows, columns, workspaceSlug)}
        />
    );
});

export default ProjectsInsightTable;
