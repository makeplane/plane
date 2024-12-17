import { FC } from "react";
import { observer } from "mobx-react";
// components
import useSWR from "swr";
import { Loader } from "@plane/ui";
import { ActivityItem } from "@/plane-web/components/common/activity/actions/helpers/activity-item";
import { ProjectActivityService } from "@/plane-web/services";
import { iconsMap, messages } from "./helper";

const projectActivityService = new ProjectActivityService();

type TProjectActivityCommentRoot = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectActivityCommentRoot: FC<TProjectActivityCommentRoot> = observer((props) => {
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

  return isLoading ? (
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
            iconsMap={iconsMap}
            messages={messages}
          />
        ))}
    </div>
  );
});
