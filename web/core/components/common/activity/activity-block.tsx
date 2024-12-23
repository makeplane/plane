"use client";

import { FC, ReactNode } from "react";
import { Network } from "lucide-react";
// hooks
import { Tooltip } from "@plane/ui";
import { renderFormattedTime, renderFormattedDate, calculateTimeAgo } from "@/helpers/date-time.helper";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { TProjectActivity } from "@/plane-web/types";
import { User } from "./user";

type TActivityBlockComponent = {
  icon?: ReactNode;
  activity: TProjectActivity;
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
      className={`relative flex items-center gap-3 text-xs ${
        ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`
      }`}
    >
      <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-custom-background-80" aria-hidden />
      <div className="flex-shrink-0 ring-6 w-7 h-7 rounded-full overflow-hidden flex justify-center items-center z-[4] bg-custom-background-80 text-custom-text-200">
        {icon ? icon : <Network className="w-3.5 h-3.5" />}
      </div>
      <div className="w-full truncate text-custom-text-200">
        <User activity={activity} customUserName={customUserName} /> {children}
        <div className="mt-1">
          <Tooltip
            isMobile={isMobile}
            tooltipContent={`${renderFormattedDate(activity.created_at)}, ${renderFormattedTime(activity.created_at)}`}
          >
            <span className="whitespace-nowrap text-custom-text-350 font-medium">
              {calculateTimeAgo(activity.created_at)}
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};
