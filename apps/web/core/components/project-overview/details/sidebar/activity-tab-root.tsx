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
import { observer } from "mobx-react";
import useSWR from "swr";
// plane package imports
import { E_SORT_ORDER } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { Loader } from "@plane/ui";
// components
import { ActivityItem } from "@/components/common/activity/activity-item";
import { ActivitySortRoot } from "@/components/issues/issue-detail/issue-activity";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web
import { SidebarContentWrapper } from "@/components/common/layout/sidebar/content-wrapper";
// services
import { ProjectActivityService } from "@/services/project/project-activity.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const projectActivityService = new ProjectActivityService();

export const ProjectOverviewSidebarActivityRoot = observer(function ProjectOverviewSidebarActivityRoot(props: Props) {
  const { workspaceSlug, projectId } = props;
  // states
  const { storedValue: sortOrder, setValue: setSortOrder } = useLocalStorage<E_SORT_ORDER>(
    "project_overview_activity_sort_order",
    E_SORT_ORDER.ASC
  );
  // store hooks
  const { getProjectById } = useProject();

  // derived values
  const project = getProjectById(projectId);

  // handlers
  const toggleSortOrder = () => setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);

  // api calls
  const { data: activity, isLoading } = useSWR(
    projectId && workspaceSlug ? `PROJECT_ACTIVITY_${projectId}` : null,
    projectId && workspaceSlug ? () => projectActivityService.getProjectActivities(workspaceSlug, projectId) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const sortedActivity = useMemo(
    () => (activity ? (sortOrder === E_SORT_ORDER.DESC ? [...activity].reverse() : activity) : []),
    [sortOrder, activity]
  );

  if (!project) return null;

  return (
    <SidebarContentWrapper
      title="Activity"
      actionElement={<ActivitySortRoot sortOrder={sortOrder ?? E_SORT_ORDER.ASC} toggleSort={toggleSortOrder} />}
    >
      <div className="space-y-4 pt-3 pb-20">
        <div className="space-y-3">
          <div className="min-h-[200px]">
            <div className="space-y-3">
              {isLoading ? (
                <Loader className="space-y-3">
                  <Loader.Item height="34px" width="100%" />
                  <Loader.Item height="34px" width="100%" />
                  <Loader.Item height="34px" width="100%" />
                </Loader>
              ) : (
                <div>
                  {sortedActivity &&
                    sortedActivity.map((activityComment, index) => (
                      <ActivityItem
                        key={activityComment.id}
                        activity={activityComment}
                        ends={index === 0 ? "top" : index === sortedActivity.length - 1 ? "bottom" : undefined}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarContentWrapper>
  );
});
