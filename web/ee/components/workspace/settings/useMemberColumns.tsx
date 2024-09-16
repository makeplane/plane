// ce components
import { useMemberColumns as useCeMemberColumns } from "@/ce/components/workspace/settings/useMemberColumns";
// components
import { RowData } from "@/components/workspace/settings/member-columns";
// constants
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const useMemberColumns = () => {
  const { columns, workspaceSlug, removeMemberModal, setRemoveMemberModal } = useCeMemberColumns();
  const [fullName, display_name, email, accountType, authentication, joiningDate] = columns;
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
  const eeColumns = [
    fullName,
    display_name,
    email,
    accountType,
    {
      key: "Billing Status",
      content: "Billing Status",
      tdRender: (rowData: RowData) => (
        <div className="w-36">{rowData.role < EUserPermissions.MEMBER ? "Inactive" : "Active"}</div>
      ),
    },
    authentication,
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
