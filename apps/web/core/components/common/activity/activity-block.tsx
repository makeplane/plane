"use client";

import { FC, ReactNode } from "react";
import { Network } from "lucide-react";
// types
import { TWorkspaceBaseActivity } from "@plane/types";
// ui
import { Tooltip } from "@plane/ui";
// helpers
import { renderFormattedTime, renderFormattedDate, calculateTimeAgo } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { User } from "./user";

type TActivityBlockComponent = {
  icon?: ReactNode;
  activity: TWorkspaceBaseActivity;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
  customUserName?: string;
};

export const ActivityBlockComponent: FC<TActivityBlockComponent> = (props) => {
  const { icon, activity, ends, children, customUserName } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  if (!activity) return <></>;
  return (
    <div
      className={`relative flex items-start gap-2 text-xs ${
        ends === "top" ? `pb-3` : ends === "bottom" ? `pt-3` : `py-3`
      }`}
    >
      <div className="flex-shrink-0 ring-6 w-7 h-7 rounded-full overflow-hidden flex justify-center items-start mt-0.5 z-[4] text-custom-text-200">
        {icon ? icon : <Network className="w-3.5 h-3.5" />}
      </div>
      <div className="w-full text-custom-text-200">
        <div className="line-clamp-2">
          <User activity={activity} customUserName={customUserName} /> {children}
        </div>
        <div className="mt-1">
          <Tooltip
            isMobile={isMobile}
            tooltipContent={`${renderFormattedDate(activity.created_at)}, ${renderFormattedTime(activity.created_at)}`}
          >
            <span className="whitespace-nowrap text-custom-text-350 font-medium cursor-help">
              {calculateTimeAgo(activity.created_at)}
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
