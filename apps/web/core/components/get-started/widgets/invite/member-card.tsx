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

import type { FC } from "react";
import { memo } from "react";
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";

type MemberCardProps = {
  readonly userId: string;
  readonly getUserDetails: (userId: string) => any;
};

export const MemberCard: FC<MemberCardProps> = memo(function MemberCard({ userId, getUserDetails }) {
  const member = getUserDetails(userId);

  if (!member) return null;

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-30 shrink-0">
      <Avatar src={getFileURL(member.avatar_url)} size={40} name={member.display_name} />
      <div className="flex flex-col items-center justify-center gap-1 w-full">
        <span className="text-body-sm-medium text-primary truncate w-full text-center">{member.display_name}</span>
        {member.email && (
          <Tooltip tooltipContent={member.email} position="top">
            <span className="text-body-xs-regular text-tertiary w-full truncate text-center">{member.email}</span>
          </Tooltip>
        )}
      </div>
    </div>
  );
});
