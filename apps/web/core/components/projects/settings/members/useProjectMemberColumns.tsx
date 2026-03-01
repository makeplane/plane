/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { IWorkspaceMember, TProjectMembership } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// components
import { MemberHeaderColumn } from "@/components/projects/common/column-header";
import { AccountTypeColumn, NameColumn } from "@/components/projects/settings/members/member-columns";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import type { IMemberFilters } from "@/store/member/utils";

export interface RowData extends Pick<TProjectMembership, "original_role"> {
  member: IWorkspaceMember;
}

// Remove the wrapper component - use ProjectMemberHeaderColumn directly

type TUseProjectMemberColumnsProps = {
  projectId: string;
  workspaceSlug: string;
};

export const useProjectMemberColumns = (props: TUseProjectMemberColumnsProps) => {
  const { projectId, workspaceSlug } = props;
  // states
  const [removeMemberModal, setRemoveMemberModal] = useState<RowData | null>(null);

  // store hooks
  const { data: currentUser } = useUser();
  const { allowPermissions, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const {
    project: {
      filters: { getFilters, updateFilters },
    },
  } = useMember();
  // derived values
  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId.toString()
  );
  const currentProjectRole =
    getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug.toString(), projectId.toString()) ?? EUserPermissions.GUEST;

  const displayFilters = getFilters(projectId);

  // handlers
  const handleDisplayFilterUpdate = (filters: Partial<IMemberFilters>) => {
    updateFilters(projectId, filters);
  };

  const columns = [
    {
      key: "Full Name",
      content: "Full name",
      thClassName: "text-left",
      thRender: () => (
        <MemberHeaderColumn
          property="full_name"
          displayFilters={displayFilters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
      tdRender: (rowData: RowData) => (
        <NameColumn
          rowData={rowData}
          workspaceSlug={workspaceSlug}
          isAdmin={isAdmin}
          currentUser={currentUser}
          setRemoveMemberModal={setRemoveMemberModal}
        />
      ),
    },
    {
      key: "Display Name",
      content: "Display name",
      thRender: () => (
        <MemberHeaderColumn
          property="display_name"
          displayFilters={displayFilters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
      tdRender: (rowData: RowData) => <div className="w-32">{rowData.member.display_name}</div>,
    },
    {
      key: "Email",
      content: "Email",
      thRender: () => (
        <MemberHeaderColumn
          property="email"
          displayFilters={displayFilters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
      tdRender: (rowData: RowData) => <div className="w-48 text-secondary">{rowData.member.email}</div>,
    },
    {
      key: "Account Type",
      content: "Account type",
      thRender: () => (
        <MemberHeaderColumn
          property="role"
          displayFilters={displayFilters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
      tdRender: (rowData: RowData) => (
        <AccountTypeColumn
          rowData={rowData}
          currentProjectRole={currentProjectRole}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
      ),
    },
    {
      key: "Joining Date",
      content: "Joining date",
      thRender: () => (
        <MemberHeaderColumn
          property="joining_date"
          displayFilters={displayFilters}
          handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        />
      ),
      tdRender: (rowData: RowData) => <div>{renderFormattedDate(rowData?.member?.joining_date)}</div>,
    },
  ];
  return {
    columns,
    removeMemberModal,
    setRemoveMemberModal,
    displayFilters,
    handleDisplayFilterUpdate,
  };
};
