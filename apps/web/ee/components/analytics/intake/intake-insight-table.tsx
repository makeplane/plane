import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Briefcase } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { IntakeInsightColumns } from "@plane/types";
// components
import { exportCSV } from "@/components/analytics/export";
import { InsightTable } from "@/components/analytics/insight-table";
import { Logo } from "@/components/common/logo";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";

const analyticsService = new AnalyticsService();

const IntakeInsightTable = observer(() => {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { t } = useTranslation();
  const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView } = useAnalytics();
  const { data: intakeData, isLoading } = useSWR(
    `insights-table-intake-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsStats<IntakeInsightColumns[]>(
        workspaceSlug,
        "intake",
        {
          //   date_filter: selectedDuration,
          ...(selectedProjects?.length > 0 ? { project_ids: selectedProjects.join(",") } : {}),
          ...(selectedCycle ? { cycle_id: selectedCycle } : {}),
          ...(selectedModule ? { module_id: selectedModule } : {}),
        },
        isPeekView
      )
  );

  // Labels for summary fields
  const columnsLabels: Record<string, string> = useMemo(
    () => ({
      project_name: t("common.project"),
      total_work_items: t("workspace_analytics.total", { entity: t("work_items") }),
      accepted_intake: t("inbox_issue.status.accepted.title"),
      rejected_intake: t("inbox_issue.status.declined.title"),
      duplicate_intake: t("inbox_issue.status.duplicate.title"),
    }),
    [t]
  );

  const columns: ColumnDef<IntakeInsightColumns>[] = useMemo(
    () => [
      {
        accessorKey: "project__name",
        header: () => <div className="text-left">{columnsLabels["project_name"]}</div>,
        cell: ({ row }: { row: { original: IntakeInsightColumns } }) => (
          <div className="flex items-center gap-2">
            {row.original.project_id ? (
              row.original.project__logo_props && <Logo logo={row.original.project__logo_props} size={18} />
            ) : (
              <Briefcase className="h-4 w-4" />
            )}
            {row.original.project__name}
          </div>
        ),
        meta: {
          export: {
            key: columnsLabels["project_name"],
            value: (row) => row.original.project__name,
          },
        },
      },
      {
        accessorKey: "total_work_items",
        header: () => <div className="text-right">{columnsLabels["total_work_items"]}</div>,
        cell: ({ row }: { row: { original: IntakeInsightColumns } }) => (
          <div className="text-right">{row.original.total_work_items}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["total_work_items"],
            value: (row) => row.original.total_work_items,
          },
        },
      },
      {
        accessorKey: "accepted_intake",
        header: () => <div className="text-right">{columnsLabels["accepted_intake"]}</div>,
        cell: ({ row }: { row: { original: IntakeInsightColumns } }) => (
          <div className="text-right">{row.original.accepted_intake}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["accepted_intake"],
            value: (row) => row.original.accepted_intake,
          },
        },
      },
      {
        accessorKey: "rejected_intake",
        header: () => <div className="text-right">{columnsLabels["rejected_intake"]}</div>,
        cell: ({ row }: { row: { original: IntakeInsightColumns } }) => (
          <div className="text-right">{row.original.rejected_intake}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["rejected_intake"],
            value: (row) => row.original.rejected_intake,
          },
        },
      },
      {
        accessorKey: "duplicate_intake",
        header: () => <div className="text-right">{columnsLabels["duplicate_intake"]}</div>,
        cell: ({ row }: { row: { original: IntakeInsightColumns } }) => (
          <div className="text-right">{row.original.duplicate_intake}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["duplicate_intake"],
            value: (row) => row.original.duplicate_intake,
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
      columnsLabels={columnsLabels}
      headerText={t("common.projects")}
      onExport={(rows) => intakeData && exportCSV(rows, columns, workspaceSlug)}
    />
  );
});

export default IntakeInsightTable;
