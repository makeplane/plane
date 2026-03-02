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

import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@plane/propel/avatar";
// hooks
import { useUser } from "@/hooks/store/user";
import { getFileURL } from "@plane/utils";

export const ProfileSettingsSidebarHeader = observer(function ProfileSettingsSidebarHeader() {
  // store hooks
  const { data: currentUser } = useUser();

  return (
    <div className="shrink-0 flex items-center gap-2">
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
        <p className="text-body-sm-medium truncate">
          {currentUser?.first_name} {currentUser?.last_name}
        </p>
        <p className="text-caption-md-regular truncate">{currentUser?.email}</p>
      </div>
    </div>
  );
});
