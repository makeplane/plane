import { useContext } from "react";
import type { ReactNode } from "react";
import { Network } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { renderFormattedTime, renderFormattedDate, calculateTimeAgo } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { IssueCreatorDisplay } from "@/plane-web/components/issues/issue-details/issue-creator";
// local imports
import { IssueUser } from "../";
import { ActivitySlotContext } from "../../activity-slot-context";

type TIssueActivityBlockComponent = {
  icon?: ReactNode;
  activityId: string;
  ends: "top" | "bottom" | undefined;
  children: ReactNode;
  customUserName?: string;
  actionSlot?: ReactNode;
};

export function IssueActivityBlockComponent(props: TIssueActivityBlockComponent) {
  const { icon, activityId, ends, children, customUserName, actionSlot: actionSlotProp } = props;
  // Read actionSlot from context as fallback (set by IssueActivityItem)
  const contextSlot = useContext(ActivitySlotContext);
  const actionSlot = actionSlotProp ?? contextSlot;
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);
  const { isMobile } = usePlatformOS();
  if (!activity) return <></>;
  return (
    <div
      className={`group relative flex items-center gap-3 text-caption-sm-regular ${
        ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`
      }`}
    >
      <div className="absolute left-[13px] top-0 bottom-0 w-px bg-layer-3" aria-hidden />
      <div className="flex-shrink-0 w-7 h-7 rounded-lg overflow-hidden flex justify-center items-center z-[4] bg-layer-2 text-secondary border border-subtle shadow-raised-100">
        {icon ? icon : <Network className="w-3.5 h-3.5" />}
      </div>
      <div className="w-full truncate text-secondary">
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
            <span className="whitespace-nowrap text-tertiary"> {calculateTimeAgo(activity.created_at)}</span>
          </Tooltip>
        </span>
      </div>
      {actionSlot}
    </div>
  );
}
