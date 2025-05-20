import { useState } from "react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { IWorkspaceMember, TProjectMembership } from "@plane/types";
// components
import { AccountTypeColumn, NameColumn } from "@/components/project/settings/member-columns";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store";

export interface RowData extends Pick<TProjectMembership, "original_role"> {
  member: IWorkspaceMember;
}

type TUseProjectColumnsProps = {
  projectId: string;
  workspaceSlug: string;
};

export const useProjectColumns = (props: TUseProjectColumnsProps) => {
  const { projectId, workspaceSlug } = props;
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState<RowData | null>(null);
  // store hooks
  const { data: currentUser } = useUser();
  const { allowPermissions, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId.toString()
  );
  const currentProjectRole =
    getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug.toString(), projectId.toString()) ?? EUserPermissions.GUEST;

  const getFormattedDate = (dateStr: string) => {
    const date = new Date(dateStr);

    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

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
  return { columns, removeMemberModal, setRemoveMemberModal };
};
