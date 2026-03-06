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

import type { RowData } from "../helper";
import { SuspendedUserIcon, TrashIcon } from "@plane/propel/icons";
import { Menu } from "@plane/propel/menu";
import { Avatar } from "@plane/propel/avatar";
import { cn, getFileURL } from "@plane/utils";
import type { IUser } from "@plane/types";

type TProps = {
  rowData: RowData;
  handleRemoveMember: (rowData: RowData) => void;
  currentUser: IUser | undefined;
};

export function NameColumn(props: TProps) {
  const { rowData, handleRemoveMember, currentUser } = props;
  // derived values
  const { avatar_url, display_name, first_name, last_name } = rowData.member;
  const isSuspended = rowData.member.is_active === false;

  return (
    <div className="flex gap-2 items-center w-48">
      {/* */}
      {isSuspended ? (
        <div className="bg-layer-1 rounded-full size-4 flex items-center justify-center">
          <SuspendedUserIcon className="text-placeholder w-3.5" />
        </div>
      ) : (
        <Avatar name={display_name} src={getFileURL(avatar_url)} size="sm" />
      )}
      <span className={cn("text-12", isSuspended ? "text-placeholder" : "")}>
        {first_name} {last_name}
      </span>
      {currentUser?.id !== rowData.member.id && !isSuspended && (
        <Menu ellipsis>
          <Menu.MenuItem onClick={() => handleRemoveMember(rowData)}>
            <div className="flex items-center gap-2 text-danger-primary">
              <TrashIcon className="size-3" />
              <span>Remove</span>
            </div>
          </Menu.MenuItem>
        </Menu>
      )}
    </div>
  );
}
