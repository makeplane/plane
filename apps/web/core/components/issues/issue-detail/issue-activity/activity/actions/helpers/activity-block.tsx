"use client";

import { FC, ReactNode, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { Network } from "lucide-react";
// plane imports
import { ACTIVITY_HIGHLIGHT_TIMEOUT } from "@plane/constants";
import { Tooltip } from "@plane/ui";
import { cn, renderFormattedTime, renderFormattedDate, calculateTimeAgo } from "@plane/utils";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications/use-workspace-notifications";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { IssueCreatorDisplay } from "@/plane-web/components/issues/issue-details/issue-creator";
// local imports
import { IssueUser } from "../";

type TIssueActivityBlockComponent = {
  icon?: ReactNode;
  activityId: string;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
  customUserName?: string;
};

export const IssueActivityBlockComponent: FC<TIssueActivityBlockComponent> = observer((props) => {
  const { icon, activityId, ends, children, customUserName } = props;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();
  const { higlightedActivityIds, setHighlightedActivityIds } = useWorkspaceNotifications();

  const activity = getActivityById(activityId);
  const { isMobile } = usePlatformOS();
  const activityBlockRef = useRef<HTMLDivElement>(null);
  //scroll self into view id is present in higlightedActivityIds use ref
  useEffect(() => {
    if (higlightedActivityIds.length > 0 && higlightedActivityIds[0] === activityId) {
      if (activityBlockRef.current) {
        activityBlockRef.current.scrollIntoView({ behavior: "smooth" });
      }
      // reset highlighted activity ids after 5 seconds
      setTimeout(() => {
        setHighlightedActivityIds([]);
      }, ACTIVITY_HIGHLIGHT_TIMEOUT);
    }
  }, [higlightedActivityIds, activityId]);
  if (!activity) return <></>;
  return (
    <div
      className={`relative flex items-center gap-3 text-xs ${
        ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`
      }`}
      ref={activityBlockRef}
    >
      <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-custom-background-80" aria-hidden />
      <div
        className={cn(
          "flex-shrink-0 ring-6 w-7 h-7 rounded-full overflow-hidden flex justify-center items-center z-[4] bg-custom-background-80 transition-border duration-1000 border-2 border-transparent",
          higlightedActivityIds.includes(activityId) ? "border-custom-primary-100" : "",
          "text-custom-text-200"
        )}
      >
        {icon ? icon : <Network className="w-3.5 h-3.5" />}
      </div>
      <div className="w-full truncate text-custom-text-200">
        {!activity?.field && activity?.verb === "created" ? (
          <IssueCreatorDisplay activityId={activityId} customUserName={customUserName} />
        ) : (
          <IssueUser activityId={activityId} customUserName={customUserName} />
        )}
        <span> {children} </span>
        <span>
          <Tooltip
            isMobile={isMobile}
            tooltipContent={`${renderFormattedDate(activity.created_at)}, ${renderFormattedTime(activity.created_at)}`}
          >
            <span className="whitespace-nowrap text-custom-text-350"> {calculateTimeAgo(activity.created_at)}</span>
          </Tooltip>
        </span>
      </div>
    </div>
  );
});
