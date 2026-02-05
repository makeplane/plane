import { FC } from "react";
import Link from "next/link";
// hooks
import { useIssueDetail } from "@/hooks/store";

type TIssueUser = {
  activityId: string;
  customUserName?: string;
};

export const IssueUser: FC<TIssueUser> = (props) => {
  const { activityId, customUserName } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  const isDeactivated = activity?.actor_detail?.is_active === false;

  return (
    <>
      {customUserName ? (
        <span className="text-custom-text-100 font-medium">{customUserName}</span>
      ) : isDeactivated ? (
        <span className="text-custom-text-100 font-medium opacity-60 line-through">
          {activity.actor_detail?.display_name}{" "}
          <span className="text-xs text-custom-text-400">(Deactivated)</span>
        </span>
      ) : (
        <Link
          href={`/${activity?.workspace_detail?.slug}/profile/${activity?.actor_detail?.id}`}
          className="hover:underline text-custom-text-100 font-medium"
        >
          {activity.actor_detail?.display_name}
        </Link>
      )}
    </>
  );
};
