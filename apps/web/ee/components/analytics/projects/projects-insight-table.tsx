import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Briefcase } from "lucide-react";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { ProjectInsightColumns } from "@plane/types";
import { Logo } from "@plane/ui";
// components
import { exportCSV } from "@/components/analytics/export";
import { InsightTable } from "@/components/analytics/insight-table";
import TrendPiece from "@/components/analytics/trend-piece";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";

const analyticsService = new AnalyticsService();

const ProjectsInsightTable = observer(() => {
  // router
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();
  const { t } = useTranslation();
  // store hooks
  const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView } = useAnalytics();
  const { data: projectsData, isLoading } = useSWR(
    `insights-table-projects-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsStats<ProjectInsightColumns[]>(
        workspaceSlug,
        "projects",
        {
          // date_filter: selectedDuration,
          ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
        },
        isPeekView
      )
  );

  const columnsLabels: Record<string, string> = useMemo(
    () => ({
      name: t("common.name"),
      members: t("common.members"),
      epics: t("common.epics"),
      work_items: t("common.work_items"),
      cycles: t("common.cycles"),
      modules: t("common.modules"),
      pages: t("common.pages"),
      views: t("common.views"),
      intake: t("intake"),
    }),
    [t]
  );

  const columns = useMemo(
    () =>
      [
        {
          accessorKey: "name",
          header: () => <div className="text-left">{columnsLabels["name"]}</div>,
          cell: ({ row }) => (
            <div className="flex justify-between gap-2">
              <div className="flex items-center gap-2">
                {row.original.logo_props ? (
                  <Logo logo={row.original.logo_props} size={18} />
                ) : (
                  <Briefcase className="h-4 w-4" />
                )}
                {row.original.name}
              </div>
              <TrendPiece
                percentage={
                  row.original.total_work_items > 0
                    ? isNaN((row.original.completed_work_items / row.original.total_work_items) * 100)
                      ? 0
                      : (row.original.completed_work_items / row.original.total_work_items) * 100
                    : 0
                }
                variant="tinted"
                trendIconVisible={false}
              />
            </div>
          ),
          meta: {
            export: {
              key: columnsLabels["name"],
              value: (row) => {
                const percentage = (row.original.completed_work_items / row.original.total_work_items) * 100;
                return `${row.original.name} (${Math.round(percentage)}%)`;
              },
            },
          },
        },
        {
          accessorKey: "total_members",
          header: () => <div className="text-right">{columnsLabels["members"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.total_members}</div>,
          meta: {
            export: {
              key: columnsLabels["members"],
              value: (row) => row.original.total_members,
            },
          },
        },
        {
          accessorKey: "total_epics",
          header: () => <div className="text-right">{columnsLabels["epics"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.total_epics}</div>,
          meta: {
            export: {
              key: columnsLabels["epics"],
              value: (row) => row.original.total_epics,
            },
          },
        },
        {
          accessorKey: "total_work_items",
          header: () => <div className="text-right">{columnsLabels["work_items"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.total_work_items}</div>,
          meta: {
            export: {
              key: columnsLabels["work_items"],
              value: (row) => row.original.total_work_items,
            },
          },
        },
        {
          accessorKey: "total_cycles",
          header: () => <div className="text-right">{columnsLabels["cycles"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.total_cycles}</div>,
          meta: {
            export: {
              key: columnsLabels["cycles"],
              value: (row) => row.original.total_cycles,
            },
          },
        },
        {
          accessorKey: "total_modules",
          header: () => <div className="text-right">{columnsLabels["modules"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.total_modules}</div>,
          meta: {
            export: {
              key: columnsLabels["modules"],
              value: (row) => row.original.total_modules,
            },
          },
        },
        {
          accessorKey: "total_pages",
          header: () => <div className="text-right">{columnsLabels["pages"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.total_pages}</div>,
          meta: {
            export: {
              key: columnsLabels["pages"],
              value: (row) => row.original.total_pages,
            },
          },
        },
        {
          accessorKey: "total_views",
          header: () => <div className="text-right">{columnsLabels["views"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.total_views}</div>,
          meta: {
            export: {
              key: columnsLabels["views"],
              value: (row) => row.original.total_views,
            },
          },
        },
        {
          accessorKey: "total_intake",
          header: () => <div className="text-right">{columnsLabels["intake"]}</div>,
          cell: ({ row }) => <div className="text-right">{row.original.total_intake}</div>,
          meta: {
            export: {
              key: columnsLabels["intake"],
              value: (row) => row.original.total_intake,
            },
          },
        },
      ] as ColumnDef<ProjectInsightColumns>[],
    [columnsLabels]
  );

  return (
    <InsightTable<"projects">
      analyticsType="projects"
      data={projectsData}
      isLoading={isLoading}
      columns={columns}
      columnsLabels={columnsLabels}
      headerText={t("common.projects")}
      onExport={(rows) => projectsData && exportCSV(rows, columns, workspaceSlug)}
    />
  );
});

export default ProjectsInsightTable;
