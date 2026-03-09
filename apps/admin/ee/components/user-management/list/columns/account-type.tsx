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

import { Pill, EPillVariant, EPillSize } from "@plane/propel/pill";
import { Menu } from "@plane/propel/menu";
import { useInstanceUser } from "@/plane-admin/hooks/store/use-instance-user";
import { useUser } from "@/hooks/store";
import type { RowData } from "../helper";

type TProps = {
  rowData: RowData;
};
export const AccountTypeColumn = (props: TProps) => {
  const { rowData } = props;
  const { toggleUserRole } = useInstanceUser();
  const { currentUser } = useUser();

  const isSuspended = rowData.member.is_active === false;
  const isAdmin = rowData.member.is_instance_admin;
  const isCurrentUser = currentUser?.id === rowData.member.id;

  return (
    <div className="w-32">
      {isSuspended ? (
        <div className="flex ">
          <Pill variant={EPillVariant.DEFAULT} size={EPillSize.SM} className="border-none">
            Suspended
          </Pill>
        </div>
      ) : isCurrentUser ? (
        <div className="text-12">{isAdmin ? "Instance Admin" : "User"}</div>
      ) : (
        <Menu label={isAdmin ? "Instance Admin" : "User"} noBorder>
          <Menu.MenuItem onClick={() => toggleUserRole(rowData.member.id, "admin")}>Instance Admin</Menu.MenuItem>
          <Menu.MenuItem onClick={() => toggleUserRole(rowData.member.id, "user")}>User</Menu.MenuItem>
        </Menu>
      )}
    </div>
  );
};
