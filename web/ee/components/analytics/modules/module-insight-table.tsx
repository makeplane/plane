import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Briefcase } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ModuleInsightColumns } from "@plane/types";
import { Logo, ModuleStatusIcon } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
// components
import { exportCSV } from "@/components/analytics/export";
import { InsightTable } from "@/components/analytics/insight-table";
// hooks
import { useMember } from "@/hooks/store";
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
import { UserAvatarName } from "../user-avatar-name";

const analyticsService = new AnalyticsService();

const ModulesInsightTable = observer(() => {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { t } = useTranslation();
  const { selectedDuration, selectedProjects } = useAnalytics();
  const { getUserDetails } = useMember();
  const { data: moduleData, isLoading } = useSWR(`insights-table-modules-${selectedDuration}-${selectedProjects}`, () =>
    analyticsService.getAdvanceAnalyticsStats<ModuleInsightColumns[]>(workspaceSlug, "modules", {
      //   date_filter: selectedDuration,
      ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
    })
  );

  const columnsLabels: Record<string, string> = useMemo(
    () => ({
      name: t("common.module") + " " + t("common.name"),
      lead: t("lead"),
      project__name: t("common.project"),
      start_date: t("start_date"),
      target_date: t("end_date"),
      completion_percentage: t("common.completion") + " " + "%",
    }),
    [t]
  );

  const columns: ColumnDef<ModuleInsightColumns>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => <div className="text-left">{columnsLabels["name"]}</div>,
        cell: ({ row }: { row: { original: ModuleInsightColumns } }) => (
          <div className="text-left flex items-center gap-2">
            <ModuleStatusIcon status={row.original.status} className="h-3.5 w-3.5 flex-shrink-0" />
            {row.original.name}
          </div>
        ),
        meta: {
          export: {
            key: columnsLabels["name"],
            value: (row) => row.original.name,
          },
        },
      },
      {
        accessorKey: "lead_id",
        header: () => <div className="text-right">{columnsLabels["lead"]}</div>,
        cell: ({ row }: { row: { original: ModuleInsightColumns } }) => (
          <div className="flex justify-end">
            <UserAvatarName userId={row.original.lead_id} />
          </div>
        ),
        meta: {
          export: {
            key: columnsLabels["lead"],
            value: (row) => getUserDetails(row.original.lead_id)?.display_name || "-",
          },
        },
      },
      {
        accessorKey: "project__name",
        header: () => <div className="text-right">{columnsLabels["project__name"]}</div>,
        cell: ({ row }: { row: { original: ModuleInsightColumns } }) => (
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              {row.original.project__logo_props ? (
                <Logo logo={row.original.project__logo_props} size={18} />
              ) : (
                <Briefcase className="h-4 w-4" />
              )}
              {row.original.project__name}
            </div>
          </div>
        ),
        meta: {
          export: {
            key: columnsLabels["project__name"],
            value: (row) => row.original.project__name,
          },
        },
      },
      {
        accessorKey: "start_date",
        header: () => <div className="text-right">{columnsLabels["start_date"]}</div>,
        cell: ({ row }: { row: { original: ModuleInsightColumns } }) => (
          <div className="text-right">{renderFormattedDate(row.original.start_date) || "-"}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["start_date"],
            value: (row) => row.original.start_date || "-",
          },
        },
      },
      {
        accessorKey: "target_date",
        header: () => <div className="text-right">{columnsLabels["target_date"]}</div>,
        cell: ({ row }: { row: { original: ModuleInsightColumns } }) => (
          <div className="text-right">{renderFormattedDate(row.original.target_date) || "-"}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["target_date"],
            value: (row) => row.original.target_date || "-",
          },
        },
      },
      {
        accessorKey: "completion_percentage",
        header: () => <div className="text-right">{columnsLabels["completion_percentage"]}</div>,
        cell: ({ row }: { row: { original: ModuleInsightColumns } }) => {
          const { completed_issues, total_issues } = row.original;
          const percentage = total_issues > 0 ? Math.round((completed_issues / total_issues) * 100) : 0;
          return <div className="text-right">{percentage}%</div>;
        },
        meta: {
          export: {
            key: columnsLabels["completion_percentage"],
            value: (row) => {
              const { completed_issues, total_issues } = row.original;
              return total_issues > 0 ? Math.round((completed_issues / total_issues) * 100) : 0;
            },
          },
        },
      },
    ],
    [columnsLabels, getUserDetails]
  );

  return (
    <InsightTable<"modules">
      analyticsType="modules"
      data={moduleData}
      isLoading={isLoading}
      columns={columns}
      columnsLabels={columnsLabels}
      headerText={t("common.modules", { count: moduleData?.length })}
      onExport={(rows) => moduleData && exportCSV(rows, columns, workspaceSlug)}
    />
  );
});

export default ModulesInsightTable;
