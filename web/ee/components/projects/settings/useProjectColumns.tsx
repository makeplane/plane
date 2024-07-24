import { EUserWorkspaceRoles } from "@/constants/workspace";
import { RowData, useProjectColumns as useCeProjectColumns } from "ce/components/projects/settings/useProjectColumns";

export const useProjectColumns = () => {
  const { columns, workspaceSlug, projectId, removeMemberModal, setRemoveMemberModal } = useCeProjectColumns();
  const [fullName, displayName, accountType, joiningDate] = columns;

  const eeColumns = [
    fullName,
    displayName,
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
  return { columns: eeColumns, workspaceSlug, projectId, removeMemberModal, setRemoveMemberModal };
};
