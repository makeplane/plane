import type { FC, ReactNode } from "react";
import { Network } from "lucide-react";
// types
import { Tooltip } from "@plane/propel/tooltip";
import type { TWorkspaceBaseActivity } from "@plane/types";
// ui
// helpers
import { renderFormattedTime, renderFormattedDate, calculateTimeAgo } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// local components
import { User } from "./user";

type TActivityBlockComponent = {
  icon?: FC<{ className?: string }>;
  activity: TWorkspaceBaseActivity;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
  customUserName?: string;
};

export function ActivityBlockComponent(props: TActivityBlockComponent) {
  const { icon: Icon, activity, ends, children, customUserName } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  if (!activity) return <></>;
  return (
    <div
      className={`relative flex items-start gap-2 text-caption-sm-regular  ${
        ends === "top" ? `pb-3` : ends === "bottom" ? `pt-3` : `py-3`
      }`}
    >
      <div className="shrink-0  w-7 h-7 rounded-lg overflow-hidden flex justify-center items-center mt-0.5 z-[4] text-secondary border border-subtle shadow-raised-100">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : <Network className="h-3.5 w-3.5 shrink-0" />}
      </div>
      <div className="w-full text-secondary">
        <div className="line-clamp-2">
          <User activity={activity} customUserName={customUserName} /> {children}
        </div>
        <div className="mt-1">
          <Tooltip
            isMobile={isMobile}
            tooltipContent={`${renderFormattedDate(activity.created_at)}, ${renderFormattedTime(activity.created_at)}`}
          >
            <span className="whitespace-nowrap text-tertiary font-medium cursor-help">
              {calculateTimeAgo(activity.created_at)}
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
