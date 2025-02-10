import { useState } from "react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { IWorkspaceMember } from "@plane/types";
import { AccountTypeColumn, NameColumn } from "@/components/project/settings/member-columns";
import { useUser, useUserPermissions } from "@/hooks/store";

export interface RowData {
  member: IWorkspaceMember;
  role: EUserPermissions;
}

export const useProjectColumns = () => {
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState<RowData | null>(null);

  const { workspaceSlug, projectId } = useParams();

  const { data: currentUser } = useUser();
  const { allowPermissions, projectUserInfo } = useUserPermissions();

  const currentProjectRole =
    (projectUserInfo?.[workspaceSlug.toString()]?.[projectId.toString()]?.role as unknown as EUserPermissions) ??
    EUserPermissions.GUEST;

  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr);

    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };
  // derived values
  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId.toString()
  );

  const columns = [
    {
      key: "Full Name",
      content: "Full name",
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
      content: "Display name",
      tdRender: (rowData: RowData) => <div className="w-32">{rowData.member.display_name}</div>,
    },

    {
      key: "Account Type",
      content: "Account type",
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
      content: "Joining date",
      tdRender: (rowData: RowData) => <div>{getFormattedDate(rowData?.member?.joining_date || "")}</div>,
    },
  ];
  return { columns, workspaceSlug, projectId, removeMemberModal, setRemoveMemberModal };
};
