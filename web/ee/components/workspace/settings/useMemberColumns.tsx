import { useMemberColumns as useCeMemberColumns } from "ce/components/workspace/settings/useMemberColumns";
import { RowData } from "@/components/workspace/settings/member-columns";
import { EUserWorkspaceRoles } from "@/constants/workspace";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const useMemberColumns = () => {
  const { columns, workspaceSlug, removeMemberModal, setRemoveMemberModal } = useCeMemberColumns();
  const [fullName, display_name, accountType, joiningDate] = columns;
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
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

  return currentWorkspaceSubscribedPlanDetail
    ? {
        columns: currentWorkspaceSubscribedPlanDetail.product === "PRO" ? eeColumns : columns,
        workspaceSlug,
        removeMemberModal,
        setRemoveMemberModal,
      }
    : {};
};
