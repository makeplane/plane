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
import Link from "next/link";
import { Avatar, AvatarGroup } from "@plane/ui";
import { getFileURL } from "@plane/utils";

type OverflowCardProps = {
  readonly overflowMembers: string[];
  readonly overflowCount: number;
  readonly workspaceSlug: string;
  readonly getUserDetails: (userId: string) => any;
};

export const OverflowCard: FC<OverflowCardProps> = memo(function OverflowCard({
  overflowMembers,
  overflowCount,
  workspaceSlug,
  getUserDetails,
}) {
  return (
    <div className="flex flex-col items-center gap-3 w-30 shrink-0">
      <AvatarGroup size={40} max={2} showTooltip>
        {overflowMembers.map((userId) => {
          const member = getUserDetails(userId);
          if (!member) return null;
          return <Avatar key={userId} src={getFileURL(member.avatar_url)} name={member.display_name} />;
        })}
      </AvatarGroup>
      <span className="text-body-md-medium text-primary">+{overflowCount} more</span>
      <Link
        href={`/${workspaceSlug}/settings/members/`}
        className="text-body-xs-regular text-tertiary w-full truncate text-center hover:underline"
      >
        View all
      </Link>
    </div>
  );
});
