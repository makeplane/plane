import { FC } from "react";
import Link from "next/link";
// hooks
import { useMember, useWorkspace } from "@/hooks/store";
// plane web
import { TInitiativeActivity } from "@/plane-web/types/initiative";

type TInitiativeUser = {
  activity: TInitiativeActivity;
  customUserName?: string;
};

export const InitiativeUser: FC<TInitiativeUser> = (props: TInitiativeUser) => {
  const { activity, customUserName } = props;
  // hooks
  const { getWorkspaceById } = useWorkspace();
  const { getUserDetails } = useMember();
  // derived values
  if (!activity || !activity.workspace || !activity.actor) return <></>;
  const workspaceDetail = getWorkspaceById(activity.workspace);
  const userDetail = getUserDetails(activity.actor);

  return (
    <>
      {customUserName ? (
        <span className="text-custom-text-100 font-medium">{customUserName}</span>
      ) : (
        <Link
          href={`/${workspaceDetail?.slug}/profile/${userDetail?.id}`}
          className="hover:underline text-custom-text-100 font-medium"
        >
          {activity.actor_detail?.display_name.includes("-intake") ? "Plane" : activity.actor_detail?.display_name}
        </Link>
      )}
    </>
  );
};
