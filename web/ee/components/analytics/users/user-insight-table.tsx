import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { UserInsightColumns } from "@plane/types";
// components
import { InsightTable } from "@/components/analytics/insight-table";
// hooks
import { useAnalytics } from "@/hooks/store/use-analytics";
// services
import { AnalyticsService } from "@/services/analytics.service";
import { UserAvatarName } from "../user-avatar-name";

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
