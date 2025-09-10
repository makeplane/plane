import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { UserInsightColumns } from "@plane/types";
// components
import { InsightTable } from "@/components/analytics/insight-table";
import { UserAvatarName } from "../user-avatar-name";

interface UsersInsightTableProps {
  data?: UserInsightColumns[];
  isLoading: boolean;
}

const UsersInsightTable = observer(({ data: usersData, isLoading }: UsersInsightTableProps) => {
  const { t } = useTranslation();

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
          meta: {
            export: {
              key: columnsLabels["display_name"],
              value: (row) => row.original.display_name,
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
              value: (row) => row.original.started_work_items,
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
              value: (row) => row.original.un_started_work_items,
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
              value: (row) => row.original.completed_work_items,
            },
          },
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
