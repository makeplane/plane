import { observer } from "mobx-react";
import * as XLSX from "xlsx";
import { ROLE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = { workspaceSlug: string };

export const WorkspaceMembersExcelExportButton = observer(function WorkspaceMembersExcelExportButton({
  workspaceSlug,
}: Props) {
  const { t } = useTranslation();
  const {
    workspace: { getFilteredWorkspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { currentWorkspace } = useWorkspace();

  const handleExport = () => {
    const memberIds = getFilteredWorkspaceMemberIds(workspaceSlug) ?? [];
    const rows = memberIds
      .map((id) => getWorkspaceMemberDetails(id))
      .filter(Boolean)
      .map((m) => ({
        [t("workspace_settings.settings.members.export.col_name")]: m!.member?.display_name ?? "-",
        [t("workspace_settings.settings.members.export.col_email")]: m!.member?.email ?? "-",
        [t("workspace_settings.settings.members.export.col_role")]:
          ROLE[m!.role as keyof typeof ROLE] ?? String(m!.role),
        [t("workspace_settings.settings.members.export.col_joining_date")]: m!.joining_date?.slice(0, 10) ?? "-",
        [t("workspace_settings.settings.members.export.col_status")]: m!.is_active
          ? t("workspace_settings.settings.members.export.status_active")
          : t("workspace_settings.settings.members.export.status_inactive"),
      }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    const workspaceName = (currentWorkspace?.name ?? workspaceSlug).replace(/\s+/g, "_");
    const datetime = new Date().toISOString().slice(0, 16).replace("T", "-").replace(":", "");
    XLSX.writeFile(wb, `${workspaceName}-members-${datetime}.xlsx`);
  };

  return (
    <Button variant="secondary" size="lg" onClick={handleExport}>
      {t("workspace_views.export.button")}
    </Button>
  );
});
