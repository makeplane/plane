import { useMemo, useCallback } from "react";
import { ColumnDef, Row } from "@tanstack/react-table";
import { download, generateCsv } from "export-to-csv";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Briefcase, UserRound } from "lucide-react";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { WorkItemInsightColumns, AnalyticsTableDataMap } from "@plane/types";
// plane web components
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { Logo } from "@/components/common/logo";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useProject } from "@/hooks/store/use-project";
import { AnalyticsService } from "@/services/analytics.service";
// plane web components
import { csvConfig } from "../config";
import { InsightTable } from "../insight-table";

const analyticsService = new AnalyticsService();

const WorkItemsInsightTable = observer(() => {
  // router
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView } = useAnalytics();
  const { data: workItemsData, isLoading } = useSWR(
    `insights-table-work-items-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsStats<WorkItemInsightColumns[]>(
        workspaceSlug,
        "work-items",
        {
          // date_filter: selectedDuration,
          ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
        },
        isPeekView
      )
  );
  // derived values
  const columnsLabels: Record<keyof Omit<WorkItemInsightColumns, "project_id" | "avatar_url" | "assignee_id">, string> =
    useMemo(
      () => ({
        backlog_work_items: t("workspace_projects.state.backlog"),
        started_work_items: t("workspace_projects.state.started"),
        un_started_work_items: t("workspace_projects.state.unstarted"),
        completed_work_items: t("workspace_projects.state.completed"),
        cancelled_work_items: t("workspace_projects.state.cancelled"),
        project__name: t("common.project"),
        display_name: t("common.assignee"),
      }),
      [t]
    );
  const columns = useMemo(
    () =>
      [
        !isPeekView
          ? {
              accessorKey: "project__name",
              header: () => <div className="text-left">{columnsLabels["project__name"]}</div>,
              cell: ({ row }) => {
                const project = getProjectById(row.original.project_id);
                return (
                  <div className="flex items-center gap-2">
                    {project?.logo_props ? (
                      <Logo logo={project.logo_props} size={18} />
                    ) : (
                      <Briefcase className="h-4 w-4" />
                    )}
                    {project?.name}
                  </div>
                );
              },
            }
          : {
              accessorKey: "display_name",
              header: () => <div className="text-left">{columnsLabels["display_name"]}</div>,
              cell: ({ row }: { row: Row<WorkItemInsightColumns> }) => (
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
                      <div className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-custom-background-80  capitalize overflow-hidden">
                        {row.original.display_name ? (
                          row.original.display_name?.[0]
                        ) : (
                          <UserRound className="text-custom-text-200 " size={12} />
                        )}
                      </div>
                    )}
                    <span className="break-words text-custom-text-200">
                      {row.original.display_name ?? t(`Unassigned`)}
                    </span>
                  </div>
                </div>
              ),
            },
        {
          accessorKey: "backlog_work_items",
          header: () => <div className="text-right">{columnsLabels["backlog_work_items"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.backlog_work_items}</div>,
        },
        {
          accessorKey: "started_work_items",
          header: () => <div className="text-right">{columnsLabels["started_work_items"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.started_work_items}</div>,
        },
        {
          accessorKey: "un_started_work_items",
          header: () => <div className="text-right">{columnsLabels["un_started_work_items"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.un_started_work_items}</div>,
        },
        {
          accessorKey: "completed_work_items",
          header: () => <div className="text-right">{columnsLabels["completed_work_items"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.completed_work_items}</div>,
        },
        {
          accessorKey: "cancelled_work_items",
          header: () => <div className="text-right">{columnsLabels["cancelled_work_items"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.cancelled_work_items}</div>,
        },
      ] as ColumnDef<AnalyticsTableDataMap["work-items"]>[],
    [columnsLabels, getProjectById, isPeekView, t]
  );

  const exportCSV = useCallback(
    (rows: Row<AnalyticsTableDataMap["work-items"]>[]) => {
      const rowData: any = rows.map((row) => {
        const { project_id, avatar_url, assignee_id, ...exportableData } = row.original;
        return Object.fromEntries(
          Object.entries(exportableData).map(([key, value]) => {
            if (columnsLabels?.[key as keyof typeof columnsLabels]) {
              return [columnsLabels[key as keyof typeof columnsLabels], value];
            }
            return [key, value];
          })
        );
      });
      const csv = generateCsv(csvConfig(workspaceSlug))(rowData);
      download(csvConfig(workspaceSlug))(csv);
    },
    [columnsLabels, workspaceSlug]
  );

  return (
    <InsightTable<"work-items">
      analyticsType="work-items"
      data={workItemsData}
      isLoading={isLoading}
      columns={columns}
      columnsLabels={columnsLabels}
      headerText={isPeekView ? t("common.assignee") : t("common.projects")}
      onExport={exportCSV}
    />
  );
});

export default WorkItemsInsightTable;
