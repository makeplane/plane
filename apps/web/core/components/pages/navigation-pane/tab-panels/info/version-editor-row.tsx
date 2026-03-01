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
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { getUserColor } from "@plane/editor";

type VersionEditorRowProps = {
  userId: string;
  getUserDetails: (userId: string) => { display_name?: string; avatar_url?: string } | undefined;
  deactivatedUserLabel: string;
};

export const VersionEditorRow = observer(function VersionEditorRow(props: VersionEditorRowProps) {
  const { userId, getUserDetails, deactivatedUserLabel } = props;
  const userDetails = getUserDetails(userId);
  const userColor = getUserColor(userId);

  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: userColor.solid }} aria-hidden="true" />
      <Avatar
        size="sm"
        src={getFileURL(userDetails?.avatar_url ?? "")}
        name={userDetails?.display_name}
        className="shrink-0"
      />
      <span className="truncate">{userDetails?.display_name ?? deactivatedUserLabel}</span>
    </div>
  );
});
