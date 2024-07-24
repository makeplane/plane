import { RowData } from "@/components/workspace/settings/member-columns";
import { EUserWorkspaceRoles } from "@/constants/workspace";
import { useMemberColumns as useCeMemberColumns } from "ce/components/workspace/settings/useMemberColumns";

export const useMemberColumns = () => {
  const { columns, workspaceSlug, removeMemberModal, setRemoveMemberModal } = useCeMemberColumns();
  const [fullName, display_name, accountType, joiningDate] = columns;

  const eeColumns = [
    fullName,
    display_name,
    accountType,
    {
      key: "Billing Status",
      content: "Billing Status",
      tdRender: (rowData: RowData) => (
        <div className="w-36">{rowData.role < EUserWorkspaceRoles.MEMBER ? "Inactive" : "Active"}</div>
      ),
    },
    joiningDate,
  ];

  return { columns: eeColumns, workspaceSlug, removeMemberModal, setRemoveMemberModal };
};
