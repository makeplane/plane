import { useState } from "react";
import { useParams } from "next/navigation";
import { IWorkspaceMember } from "@plane/types";
import { EUserProjectRoles } from "@plane/types/src/enums";
import { AccountTypeColumn, NameColumn } from "@/components/project/settings/member-columns";
import { EUserWorkspaceRoles } from "@/constants/workspace";
import { useUser } from "@/hooks/store";

interface RowData {
  member: IWorkspaceMember;
  role: EUserWorkspaceRoles;
}

const useProjectColumns = () => {
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState<RowData | null>(null);

  const { workspaceSlug, projectId } = useParams();

  const {
    membership: { currentProjectRole },
    data: currentUser,
  } = useUser();

  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr);

    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };
  // derived values
  const isAdmin = currentProjectRole === EUserProjectRoles.ADMIN;
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
          currentProjectRole={currentProjectRole}
          projectId={projectId as string}
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
  return { columns, workspaceSlug, projectId, removeMemberModal, setRemoveMemberModal };
};

export default useProjectColumns;
