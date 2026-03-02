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

import React from "react";
import { observer } from "mobx-react";
import { Avatar } from "@plane/propel/avatar";
import { getFileURL, cn } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";

type PageCommentAvatarProps = {
  userId: string;
  size?: "sm" | "md";
  className?: string;
};

export const PageCommentAvatar = observer(function PageCommentAvatar({
  userId,
  size = "sm",
  className = "",
}: PageCommentAvatarProps) {
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();

  const memberDetails = getWorkspaceMemberDetails(userId);

  const sizeClasses = {
    sm: "size-6",
    md: "size-8",
  };

  return (
    <Avatar
      className={cn("shrink-0 rounded-full relative", sizeClasses[size], className)}
      size="base"
      src={memberDetails?.member.avatar_url ? getFileURL(memberDetails?.member.avatar_url) : undefined}
      name={memberDetails?.member.display_name}
    />
  );
});
