/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { getFileURL } from "@plane/utils";
// hooks
import { useUser } from "@/hooks/store/user";

export const ProfileSettingsSidebarHeader = observer(function ProfileSettingsSidebarHeader() {
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="shrink-0">
        <Avatar
          alt={currentUser?.display_name}
          fallback={currentUser?.display_name?.[0]?.toUpperCase()}
          src={getFileURL(currentUser?.avatar_url ?? "")}
          size="lg"
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
