import { FC } from "react";
import Link from "next/link";
// hooks
import { useMember, useWorkspace } from "@/hooks/store";
// plane web hooks
import { useIssuePropertiesActivity } from "@/plane-web/hooks/store";

type TIssueUser = {
  activityId: string;
};

export const IssueUser: FC<TIssueUser> = (props) => {
  const { activityId } = props;
  // hooks
  const { getPropertyActivityById } = useIssuePropertiesActivity();
  const { getWorkspaceById } = useWorkspace();
  const { getUserDetails } = useMember();
  // derived values
  const activityDetail = getPropertyActivityById(activityId);
  if (!activityDetail || !activityDetail.workspace || !activityDetail.actor) return <></>;
  const workspaceDetail = getWorkspaceById(activityDetail.workspace);
  const userDetail = getUserDetails(activityDetail.actor);

  return (
    <>
      <Link
        href={`/${workspaceDetail?.slug}/profile/${userDetail?.id}`}
        className="hover:underline text-custom-text-100 font-medium"
      >
        {userDetail?.display_name}
      </Link>
    </>
  );
};
