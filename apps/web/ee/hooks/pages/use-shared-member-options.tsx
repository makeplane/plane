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

import { useMemo } from "react";
import { MemberOption } from "../../components/pages/share";
import type { TPageShareFormUser } from "./use-page-share-form";

type TMemberOptionsHookProps = {
  workspaceMemberIds: string[];
  currentUserId: string | undefined;
  sharedUsers: TPageShareFormUser[];
  getWorkspaceMemberDetails: (id: string) => any;
};

export const useMemberOptions = ({
  workspaceMemberIds,
  currentUserId,
  sharedUsers,
  getWorkspaceMemberDetails,
}: TMemberOptionsHookProps) => {
  // Simple filtering - React Hook Form already tracks the shared users
  const memberOptions = useMemo(() => {
    if (!currentUserId) return [];

    const sharedUserIds = new Set(sharedUsers.map((u) => u.user_id));

    return workspaceMemberIds
      .filter((memberId) => {
        const memberDetails = getWorkspaceMemberDetails(memberId);
        if (!memberDetails?.member) return false;

        const member = memberDetails.member;
        // Exclude current user and already shared users
        return member.id !== currentUserId && !sharedUserIds.has(member.id);
      })
      .map((memberId) => {
        const memberDetails = getWorkspaceMemberDetails(memberId);
        const member = memberDetails.member;
        const isSuspended = memberDetails?.is_active === false;

        return {
          value: member.id,
          query: `${member.first_name} ${member.last_name} ${member.display_name}`.toLowerCase(),
          disabled: isSuspended,
          content: <MemberOption key={member.id} member={member} isSuspended={isSuspended} />,
        };
      });
  }, [workspaceMemberIds, currentUserId, sharedUsers, getWorkspaceMemberDetails]);

  return { memberOptions };
};
