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
import useSWR from "swr";
// components
import { ActivityBlockComponent } from "@/components/common/activity/activity-block";
// constants
import { WORKSPACE_MEMBER_ACTIVITY } from "@/constants/fetch-keys";
// plane web imports
import { getWorkspaceMemberActivityDetails } from "@/components/workspace/settings/members/sidebar/activity/helper";
import { ActivityContentWrapper } from "@/components/settings/activity-content-wrapper";
import { useWorkspaceMembersActivity } from "@/plane-web/hooks/store/use-workspace-members-activity";
import { useMember } from "@/hooks/store/use-member";

type TWorkspaceMembersActivitySidebarProps = { workspaceSlug: string };

export const WorkspaceMembersActivitySidebar = observer(function WorkspaceMembersActivitySidebar(
  props: TWorkspaceMembersActivitySidebarProps
) {
  const { workspaceSlug } = props;
  // store hooks
  const {
    getWorkspaceMembersActivity,
    getWorkspaceMembersActivityLoader,
    getWorkspaceMembersActivitySortOrder,
    getWorkspaceMembersActivitySidebarOpen,
    toggleWorkspaceMembersActivitySortOrder,
    toggleWorkspaceMembersActivitySidebar,
    fetchWorkspaceMembersActivity,
  } = useWorkspaceMembersActivity();
  const { getUserDetails } = useMember();

  // fetching workspace members activity
  useSWR(
    workspaceSlug ? WORKSPACE_MEMBER_ACTIVITY(workspaceSlug) : null,
    workspaceSlug ? () => fetchWorkspaceMembersActivity(workspaceSlug) : null
  );

  // derived values
  const membersActivity = getWorkspaceMembersActivity(workspaceSlug) ?? [];
  const membersActivityLoader = getWorkspaceMembersActivityLoader(workspaceSlug);
  const membersActivitySortOrder = getWorkspaceMembersActivitySortOrder();
  const isSidebarOpen = getWorkspaceMembersActivitySidebarOpen(workspaceSlug);
  const toggleMembersActivitySortOrder = () => toggleWorkspaceMembersActivitySortOrder();
  const toggleMembersActivitySidebar = () => toggleWorkspaceMembersActivitySidebar(workspaceSlug, false);

  return (
    <ActivityContentWrapper
      isSidebarOpen={isSidebarOpen}
      membersActivityLoader={membersActivityLoader}
      membersActivitySortOrder={membersActivitySortOrder}
      membersActivity={membersActivity}
      toggleMembersActivitySortOrder={toggleMembersActivitySortOrder}
      toggleMembersActivitySidebar={toggleMembersActivitySidebar}
    >
      <div role="list">
        {membersActivity &&
          membersActivity.map((activityItem, index) => {
            const memberId = activityItem?.workspace_member || "";
            const memberName = memberId ? getUserDetails(memberId)?.display_name || "" : "";
            const { icon, message } = getWorkspaceMemberActivityDetails(activityItem, memberName);
            const isFirst = index === 0;
            const isLast = index === membersActivity.length - 1;

            return (
              <ActivityBlockComponent
                key={activityItem.id}
                activity={activityItem}
                icon={icon}
                ends={isFirst ? "top" : isLast ? "bottom" : undefined}
              >
                {message}
              </ActivityBlockComponent>
            );
          })}
      </div>
    </ActivityContentWrapper>
  );
});
