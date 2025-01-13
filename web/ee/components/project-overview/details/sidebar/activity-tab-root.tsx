"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader } from "@plane/ui";
// components
import { ActivityItem } from "@/components/common";
import { ActivitySortRoot } from "@/components/issues";
// constants
import { TSORT_ORDER } from "@/constants/common";
// hooks
import { useProject } from "@/hooks/store";
// plane web
import { SidebarContentWrapper } from "@/plane-web/components/common/layout/sidebar/content-wrapper";
// services
import { ProjectActivityService } from "@/plane-web/services";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

const projectActivityService = new ProjectActivityService();

export const ProjectOverviewSidebarActivityRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // states
  const [sortOrder, setSortOrder] = React.useState<TSORT_ORDER>(TSORT_ORDER.ASC);
  // store hooks
  const { getProjectById } = useProject();

  // derived values
  const project = getProjectById(projectId);

  if (!project) return null;

  // handlers
  const toggleSortOrder = () => setSortOrder(sortOrder === TSORT_ORDER.ASC ? TSORT_ORDER.DESC : TSORT_ORDER.ASC);

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
    () => (activity ? (sortOrder === TSORT_ORDER.DESC ? [...activity].reverse() : activity) : []),
    [sortOrder, activity]
  );

  return (
    <SidebarContentWrapper
      title="Activity"
      actionElement={
        <ActivitySortRoot
          sortOrder={sortOrder}
          toggleSort={toggleSortOrder}
          className="flex-shrink-0"
          iconClassName="size-3"
        />
      }
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
                  {activity &&
                    sortedActivity.map((activityComment, index) => (
                      <ActivityItem
                        key={activityComment.id}
                        activity={activityComment}
                        ends={index === 0 ? "top" : index === activity.length - 1 ? "bottom" : undefined}
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
