import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Briefcase } from "lucide-react";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { WorkItemInsightColumns, AnalyticsTableDataMap } from "@plane/types";
// plane web components
import { Logo } from "@/components/common/logo";
// hooks
import { useAnalyticsV2 } from "@/hooks/store/use-analytics-v2";
import { useProject } from "@/hooks/store/use-project";
import { AnalyticsV2Service } from "@/services/analytics-v2.service";
// plane web components
import { InsightTable } from "../insight-table";

const analyticsV2Service = new AnalyticsV2Service();

const WorkItemsInsightTable = observer(() => {
  // router
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { selectedDuration, selectedProjects, selectedCycle, selectedModule } = useAnalyticsV2();
  const { data: workItemsData, isLoading } = useSWR(
    `insights-table-work-items-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}`,
    () =>
      analyticsV2Service.getAdvanceAnalyticsStats<WorkItemInsightColumns[]>(workspaceSlug, "work-items", {
        // date_filter: selectedDuration,
        ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
        ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
        ...(selectedModule ? { module_id: selectedModule } : {}),
      })
  );
  // derived values
  const columnsLabels: Record<string, string> = {
    backlog_work_items: t("workspace_projects.state.backlog"),
    started_work_items: t("workspace_projects.state.started"),
    un_started_work_items: t("workspace_projects.state.unstarted"),
    completed_work_items: t("workspace_projects.state.completed"),
    cancelled_work_items: t("workspace_projects.state.cancelled"),
    project__name: t("common.project"),
  };
  const columns = useMemo(
    () =>
      [
        {
          accessorKey: "project__name",
          header: () => <div className="text-left">{columnsLabels["project__name"]}</div>,
          cell: ({ row }) => {
            const project = getProjectById(row.original.project_id);
            return (
              <div className="flex items-center gap-2">
                {project?.logo_props ? <Logo logo={project.logo_props} size={18} /> : <Briefcase className="h-4 w-4" />}
                {project?.name}
              </div>
            );
          },
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
    [getProjectById]
  );

  return (
    <InsightTable<"work-items">
      analyticsType="work-items"
      data={workItemsData}
      isLoading={isLoading}
      columns={columns}
      columnsLabels={columnsLabels}
    />
  );
});

export default WorkItemsInsightTable;
