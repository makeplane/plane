import { FC } from "react";

// hooks
import { useIssueDetail } from "hooks/store";
// ui

type TIssueUser = {
  activityId: string;
};

export const IssueUser: FC<TIssueUser> = (props) => {
  const { activityId } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  return (
    <a
      href={`/${activity?.workspace_detail?.slug}/profile/${activity?.actor_detail?.id}`}
      className="hover:underline text-custom-text-100 font-medium capitalize"
    >
      {activity.actor_detail?.display_name}
    </a>
  );
};
