import { useMemo, FC, useCallback } from "react";
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
import { UserInsightColumns } from "@plane/types/src/analytics-extended";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { InsightTable } from "@/components/analytics/insight-table";
import { Logo } from "@/components/common/logo";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useProject } from "@/hooks/store/use-project";
import { AnalyticsService } from "@/services/analytics.service";
import { UserAvatarName } from "../user-avatar-name";
// plane web components

const analyticsService = new AnalyticsService();

const UsersInsightTable = observer(() => {
  // router
  const params = useParams();
  const workspaceSlug = params.workspaceSlug.toString();
  const { t } = useTranslation();
  // store hooks
  const { selectedDuration, selectedProjects, selectedCycle, selectedModule, isPeekView } = useAnalytics();
  const { data: usersData, isLoading } = useSWR(
    `insights-table-users-${workspaceSlug}-${selectedDuration}-${selectedProjects}-${selectedCycle}-${selectedModule}-${isPeekView}`,
    () =>
      analyticsService.getAdvanceAnalyticsStats<UserInsightColumns[]>(
        workspaceSlug,
        "users",
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
  const columnsLabels: Record<string, string> = useMemo(
    () => ({
      display_name: t("common.member") + " " + t("common.name"),
      started_work_items: t("workspace_analytics.started_work_items", { entity: "" }),
      un_started_work_items: t("workspace_analytics.un_started_work_items", { entity: "" }),
      completed_work_items: t("workspace_analytics.completed_work_items", { entity: "" }),
    }),
    [t]
  );

  const columns = useMemo(
    () =>
      [
        {
          accessorKey: "display_name",
          header: () => <div className="text-left">{columnsLabels["display_name"]}</div>,
          cell: ({ row }) => <UserAvatarName userId={row.original.user_id} />,
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
      ] as ColumnDef<UserInsightColumns>[],
    [columnsLabels, t]
  );

  return (
    <InsightTable<"users">
      analyticsType="users"
      data={usersData}
      isLoading={isLoading}
      columns={columns}
      columnsLabels={columnsLabels}
      headerText={t("common.users")}
    />
  );
});

export default UsersInsightTable;
