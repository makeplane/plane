import { useState } from "react";
import { useParams } from "next/navigation";
import { AccountTypeColumn, NameColumn, RowData } from "@/components/workspace/settings/member-columns";
import { EUserWorkspaceRoles } from "@/constants/workspace";
import { useUser } from "@/hooks/store";

const useMemberColumns = () => {
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState<RowData | null>(null);

  const { workspaceSlug } = useParams();

  const {
    membership: { currentWorkspaceRole },
    data: currentUser,
  } = useUser();

  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr);

    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  const columns = [
    {
      key: "Full Name",
      content: "Full Name",
      thClassName: "text-left",
      tdRender: (rowData: RowData) => (
        <NameColumn
          rowData={rowData}
          workspaceSlug={workspaceSlug as string}
          isAdmin={isAdmin}
          currentUser={currentUser}
          setRemoveMemberModal={setRemoveMemberModal}
        />
      ),
    },
    {
      key: "Display Name",
      content: "Display Name",
      tdRender: (rowData: RowData) => <div className="w-32">{rowData.member.display_name}</div>,
    },

    {
      key: "Account Type",
      content: "Account Type",
      tdRender: (rowData: RowData) => (
        <AccountTypeColumn
          rowData={rowData}
          currentWorkspaceRole={currentWorkspaceRole}
          workspaceSlug={workspaceSlug as string}
        />
      ),
    },

    {
      key: "Joining Date",
      content: "Joining Date",
      tdRender: (rowData: RowData) => <div>{getFormattedDate(rowData?.member?.joining_date || "")}</div>,
    },
  ];
  return { columns, workspaceSlug, removeMemberModal, setRemoveMemberModal };
};

export default useMemberColumns;
