import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// types
import { TWorkspaceBaseActivity } from "@plane/types";
// store hooks
import { useMember, useWorkspace } from "@/hooks/store";

type TUser = {
  activity: TWorkspaceBaseActivity;
  customUserName?: string;
};

export const User: FC<TUser> = observer((props) => {
  const { activity, customUserName } = props;
  // store hooks
  const { getUserDetails } = useMember();
  const { getWorkspaceById } = useWorkspace();
  // derived values
  const actorDetail = getUserDetails(activity.actor);
  const workspaceDetail = getWorkspaceById(activity.workspace);

  return (
    <>
      {customUserName || actorDetail?.display_name.includes("-intake") ? (
        <span className="text-custom-text-100 font-medium">{customUserName || "Plane"}</span>
      ) : (
        <Link
          href={`/${workspaceDetail?.slug}/profile/${actorDetail?.id}`}
          className="hover:underline text-custom-text-100 font-medium"
        >
          {actorDetail?.display_name}
        </Link>
      )}
    </>
  );
});
