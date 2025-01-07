"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { renderFormattedTime, renderFormattedDate, calculateTimeAgo } from "@/helpers/date-time.helper";
// hooks
import { useMember, useWorkspace } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { TInitiativeActivity } from "@/plane-web/types/initiative";
import { InitiativeActivityIcon } from "./activity-icon";

type TInitiativeActivityBlockComponent = {
  activity: TInitiativeActivity;
  children: ReactNode;
  customUserName?: string;
  ends?: "top" | "bottom" | undefined;
};

export const InitiativeActivityBlock: FC<TInitiativeActivityBlockComponent> = (props) => {
  const { activity, children, customUserName, ends } = props;
  const { getWorkspaceById } = useWorkspace();
  const { getUserDetails } = useMember();
  const { isMobile } = usePlatformOS();

  if (!activity || !activity.workspace || !activity.actor) return <></>;
  const workspaceDetail = getWorkspaceById(activity.workspace);
  const userDetail = getUserDetails(activity.actor);

  if (!activity) return <></>;

  return (
    <div
      className={`relative flex items-center gap-3 text-xs ${
        ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`
      }`}
    >
      <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-custom-background-80" aria-hidden />
      <div className="flex-shrink-0 ring-6 w-7 h-7 rounded-full overflow-hidden flex justify-center items-center z-[4] bg-custom-background-80 text-custom-text-200">
        <InitiativeActivityIcon activity={activity} />
      </div>
      <div className="w-full truncate text-custom-text-200">
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
        </>{" "}
        {children}
        <span>
          <Tooltip
            isMobile={isMobile}
            tooltipContent={`${renderFormattedDate(activity.created_at)}, ${renderFormattedTime(activity.created_at)}`}
          >
            <span className="whitespace-nowrap"> {calculateTimeAgo(activity.created_at)}</span>
          </Tooltip>
        </span>
      </div>
    </div>
  );
};
