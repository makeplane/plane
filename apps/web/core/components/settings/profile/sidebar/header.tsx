/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@plane/ui";
// hooks
import { useUser } from "@/hooks/store/user";
import { getFileURL } from "@plane/utils";

export const ProfileSettingsSidebarHeader = observer(function ProfileSettingsSidebarHeader() {
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="shrink-0">
        <Avatar
          src={getFileURL(currentUser?.avatar_url ?? "")}
          name={currentUser?.display_name}
          size={32}
          shape="circle"
          className="text-16"
        />
      </div>
      <div className="truncate">
        <p className="truncate text-body-sm-medium">
          {currentUser?.first_name} {currentUser?.last_name}
        </p>
        <p className="truncate text-caption-md-regular">{currentUser?.email}</p>
      </div>
    </div>
  );
});
