import { useMemo } from "react";
import { ColumnDef, Row, RowData } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Briefcase } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CycleInsightColumns } from "@plane/types";
import { CycleGroupIcon, Logo, TCycleGroups } from "@plane/ui";
import { renderFormattedDate } from "@plane/utils";
// components
import { exportCSV } from "@/components/analytics/export";
import { InsightTable } from "@/components/analytics/insight-table";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useMember } from "@/hooks/store/use-member";
// services
import { AnalyticsService } from "@/services/analytics.service";
import { UserAvatarName } from "../user-avatar-name";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    export: {
      key: string;
      value: (row: Row<TData>) => string | number;
      label?: string;
    };
  }
}

const analyticsService = new AnalyticsService();

const CyclesInsightTable = observer(() => {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { t } = useTranslation();
  const { selectedDuration, selectedProjects } = useAnalytics();
  const { getUserDetails } = useMember();
  const { data: cycleData, isLoading } = useSWR(`insights-table-cycles-${selectedDuration}-${selectedProjects}`, () =>
    analyticsService.getAdvanceAnalyticsStats<CycleInsightColumns[]>(workspaceSlug, "cycles", {
      //   date_filter: selectedDuration,
      ...(selectedProjects?.length > 0 && { project_ids: selectedProjects?.join(",") }),
    })
  );

  const columnsLabels = useMemo(
    () => ({
      name: t("common.cycle") + " " + t("common.name"),
      lead: t("lead"),
      project__name: t("common.project"),
      start_date: t("start_date"),
      end_date: t("end_date"),
      completion_percentage: t("common.completion") + " " + "%",
    }),
    [t]
  );

  const columns: ColumnDef<CycleInsightColumns>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => <div className="text-left">{columnsLabels["name"]}</div>,
        cell: ({ row }: { row: { original: CycleInsightColumns } }) => (
          <div className="text-left flex items-center gap-2">
            <CycleGroupIcon
              cycleGroup={row.original.status.toLowerCase() as TCycleGroups}
              className="h-3.5 w-3.5 flex-shrink-0"
            />
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
        accessorKey: "owned_by_id",
        header: () => <div className="text-right">{columnsLabels["lead"]}</div>,
        cell: ({ row }: { row: { original: CycleInsightColumns } }) => (
          <div className="flex justify-end">
            <UserAvatarName userId={row.original.owned_by_id} />
          </div>
        ),
        meta: {
          export: {
            key: columnsLabels["lead"],
            value: (row) => getUserDetails(row.original.owned_by_id)?.display_name || "-",
          },
        },
      },
      {
        accessorKey: "project__name",
        header: () => <div className="text-right">{columnsLabels["project__name"]}</div>,
        cell: ({ row }: { row: { original: CycleInsightColumns } }) => (
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
        cell: ({ row }: { row: { original: CycleInsightColumns } }) => (
          <div className="text-right">{renderFormattedDate(row.original.start_date) || "-"}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["start_date"],
            value: (row) => row.original.start_date,
          },
        },
      },
      {
        accessorKey: "end_date",
        header: () => <div className="text-right">{columnsLabels["end_date"]}</div>,
        cell: ({ row }: { row: { original: CycleInsightColumns } }) => (
          <div className="text-right">{renderFormattedDate(row.original.end_date) || "-"}</div>
        ),
        meta: {
          export: {
            key: columnsLabels["end_date"],
            value: (row) => row.original.end_date,
          },
        },
      },
      {
        accessorKey: "completion_percentage",
        header: () => <div className="text-right">{columnsLabels["completion_percentage"]}</div>,
        cell: ({ row }: { row: { original: CycleInsightColumns } }) => {
          const { completed_issues, total_issues } = row.original;
          const percentage = total_issues > 0 ? Math.round((completed_issues / total_issues) * 100) : 0;
          return <div className="text-right">{percentage}%</div>;
        },
        meta: {
          export: {
            key: columnsLabels["completion_percentage"] + "",
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
    <InsightTable<"cycles">
      analyticsType="cycles"
      data={cycleData}
      isLoading={isLoading}
      columns={columns}
      columnsLabels={columnsLabels}
      headerText={t("common.cycles", { count: cycleData?.length })}
      onExport={(rows) => cycleData && exportCSV(rows, columns, workspaceSlug)}
    />
  );
});

export default CyclesInsightTable;
