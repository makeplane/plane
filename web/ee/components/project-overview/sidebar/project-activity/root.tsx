"use client";
import { FC } from "react";
import { observer } from "mobx-react";
// components
import useSWR from "swr";
import { Loader } from "@plane/ui";
import { ActivityItem } from "@/components/common";
import { ProjectActivityService } from "@/plane-web/services";
// components

type TProjectActivity = {
  workspaceSlug: string;
  projectId: string;
};

const projectActivityService = new ProjectActivityService();

export const ProjectActivity: FC<TProjectActivity> = observer((props) => {
  const { workspaceSlug, projectId } = props;
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

  return (
    <div className="space-y-4 pt-3 pb-20">
      {/* rendering activity */}
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
                  activity.map((activityComment, index) => (
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
  );
});
