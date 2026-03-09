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

import { MemberHeaderColumn } from "./header";
import type { TInstanceUser } from "@plane/types";
import { useInstanceUser } from "@/plane-admin/hooks/store/use-instance-user";
import { cn, renderFormattedDate } from "@plane/utils";
import { NameColumn } from "./columns/name";
import { useUser } from "@/hooks/store";
import { AccountTypeColumn } from "./columns/account-type";

export interface RowData {
  member: TInstanceUser;
}

type TProps = {
  handleRemoveMember: (rowData: RowData) => void;
  handleToggleRole: (rowData: RowData, role: "user" | "admin") => void;
};

export const useMemberColumns = (props: TProps) => {
  const { handleRemoveMember, handleToggleRole } = props;
  // store hooks
  const { currentUser } = useUser();
  const instanceUser = useInstanceUser();

  const handleFilterUpdate = (filters: Partial<typeof instanceUser.filters>) => {
    instanceUser.updateFilters(filters);
  };

  return [
    {
      key: "full_name",
      content: "",
      tdRender: (rowData: RowData) => (
        <NameColumn
          currentUser={currentUser}
          rowData={rowData}
          handleRemoveMember={handleRemoveMember}
          handleToggleRole={handleToggleRole}
        />
      ),
      thRender: () => (
        <MemberHeaderColumn
          property="full_name"
          filters={instanceUser.filters}
          handleFilterUpdate={handleFilterUpdate}
        />
      ),
    },
    {
      key: "display_name",
      content: "",
      tdRender: (rowData: RowData) => <div className="w-47 truncate text-12">{rowData.member.display_name || "-"}</div>,
      thRender: () => (
        <MemberHeaderColumn
          property="display_name"
          filters={instanceUser.filters}
          handleFilterUpdate={handleFilterUpdate}
        />
      ),
    },
    {
      key: "email",
      content: "",
      tdRender: (rowData: RowData) => (
        <div className={cn("w-47 truncate text-12", !rowData.member.is_active && "text-placeholder")}>
          {rowData.member.email}
        </div>
      ),
      thRender: () => (
        <MemberHeaderColumn property="email" filters={instanceUser.filters} handleFilterUpdate={handleFilterUpdate} />
      ),
    },
    {
      key: "account_type",
      content: "",
      thRender: () => (
        <MemberHeaderColumn
          property="account_type"
          filters={instanceUser.filters}
          handleFilterUpdate={handleFilterUpdate}
        />
      ),
      tdRender: (rowData: RowData) => <AccountTypeColumn rowData={rowData} />,
    },
    {
      key: "status",
      content: "",
      thRender: () => (
        <MemberHeaderColumn property="status" filters={instanceUser.filters} handleFilterUpdate={handleFilterUpdate} />
      ),
      tdRender: (rowData: RowData) => <div className="text-12">{rowData.member.is_active ? "Active" : "-"}</div>,
    },
    {
      key: "created_at",
      content: "",
      thRender: () => (
        <MemberHeaderColumn
          property="created_at"
          filters={instanceUser.filters}
          handleFilterUpdate={handleFilterUpdate}
        />
      ),
      tdRender: (rowData: RowData) => (
        <div className="w-32 text-12">
          {rowData.member.is_active ? renderFormattedDate(rowData.member.date_joined) : "-"}
        </div>
      ),
    },
  ];
};
