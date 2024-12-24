import { FC } from "react";
import Link from "next/link";
import { EIssueServiceType } from "@plane/constants";
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
  } = useIssueDetail(EIssueServiceType.EPICS);

  const activity = getActivityById(activityId);

  if (!activity) return <></>;

  return (
    <>
      {customUserName ? (
        <span className="text-custom-text-100 font-medium">{customUserName}</span>
      ) : (
        <Link
          href={`/${activity?.workspace_detail?.slug}/profile/${activity?.actor_detail?.id}`}
          className="hover:underline text-custom-text-100 font-medium"
        >
          {activity.actor_detail?.display_name.includes("-intake") ? "Plane" : activity.actor_detail?.display_name}
        </Link>
      )}
    </>
  );
};
