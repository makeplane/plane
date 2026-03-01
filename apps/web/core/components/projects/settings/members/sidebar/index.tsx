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
import { PROJECT_MEMBER_ACTIVITY } from "@/constants/fetch-keys";
// plane web imports
import { getProjectMemberActivityDetails } from "@/components/projects/settings/members/sidebar/activity/helper";
import { ActivityContentWrapper } from "@/components/settings/activity-content-wrapper";
import { useProjectMembersActivity } from "@/plane-web/hooks/store/projects/use-project-members-activity";
import { useMember } from "@/hooks/store/use-member";

type TProjectMembersActivitySidebarProps = { workspaceSlug: string; projectId: string };

export const ProjectMembersActivitySidebar = observer(function ProjectMembersActivitySidebar(
  props: TProjectMembersActivitySidebarProps
) {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const {
    getProjectMembersActivity,
    fetchProjectMembersActivity,
    getProjectMembersActivityLoader,
    getProjectMembersActivitySortOrder,
    getProjectMembersActivitySidebarOpen,
    toggleProjectMembersActivitySortOrder,
    toggleProjectMembersActivitySidebar,
  } = useProjectMembersActivity();
  const { getUserDetails } = useMember();
  // fetching project members activity
  useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBER_ACTIVITY(projectId) : null,
    workspaceSlug && projectId ? () => fetchProjectMembersActivity(workspaceSlug, projectId) : null
  );

  // derived values
  const membersActivity = getProjectMembersActivity(projectId) ?? [];
  const membersActivityLoader = getProjectMembersActivityLoader(projectId);
  const membersActivitySortOrder = getProjectMembersActivitySortOrder();
  const isSidebarOpen = getProjectMembersActivitySidebarOpen(projectId);
  const toggleMembersActivitySortOrder = () => toggleProjectMembersActivitySortOrder();
  const toggleMembersActivitySidebar = () => toggleProjectMembersActivitySidebar(projectId, false);

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
            const memberId = activityItem?.project_member || "";
            const memberName = memberId ? getUserDetails(memberId)?.display_name || "" : "";
            const { icon, message } = getProjectMemberActivityDetails(activityItem, memberName);
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
