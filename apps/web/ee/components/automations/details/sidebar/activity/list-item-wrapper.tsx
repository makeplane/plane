import { observer } from "mobx-react";
import { type LucideIcon, Repeat } from "lucide-react";
// plane imports
import { usePlatformOS } from "@plane/hooks";
import { Tooltip } from "@plane/ui";
import { calculateTimeAgo, cn, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
import { AutomationDetailsSidebarActivityRunHistoryItem } from "./run-history-item";

type Props = {
  automationId: string;
  activityId: string;
  descriptionContent?: string;
  icon?: LucideIcon;
  titleContent: string;
};

export const AutomationDetailsSidebarActivityListItemWrapper: React.FC<Props> = observer((props) => {
  const { automationId, activityId, descriptionContent, icon, titleContent } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  const { getUserDetails } = useMember();
  // derived values
  const automation = getAutomationById(automationId);
  const { getActivityById, checkIfActivityIsFirst, checkIfActivityIsLast } = automation?.activity ?? {};
  const activityDetails = getActivityById?.(activityId);
  const isFirst = checkIfActivityIsFirst?.(activityId);
  const isLast = checkIfActivityIsLast?.(activityId);
  const activityActorDetails = activityDetails?.actor ? getUserDetails(activityDetails?.actor) : undefined;
  const isRunHistory = activityDetails?.field === "automation.run_history";
  const ActivityIcon = icon ?? Repeat;
  // platform check
  const { isMobile } = usePlatformOS();

  if (!activityDetails) return null;

  return (
    <div
      className={cn("relative flex items-center gap-3 text-xs py-2", {
        "pt-0": isFirst,
        "pb-0": isLast,
      })}
    >
      <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-custom-background-80" aria-hidden />
      {isRunHistory ? (
        <AutomationDetailsSidebarActivityRunHistoryItem automationId={automationId} activityId={activityId} />
      ) : (
        <>
          <div className="shrink-0 ring-6 size-7 rounded-full overflow-hidden grid place-items-center z-[4] bg-custom-background-80 text-custom-text-200 border-2 border-transparent transition-border duration-1000">
            <ActivityIcon className="size-3.5" />
          </div>
          <div className="w-full">
            <div className="text-custom-text-200">
              <span>{activityActorDetails?.display_name}</span>
              <span> {titleContent} </span>
              <span>
                <Tooltip
                  isMobile={isMobile}
                  tooltipContent={`${renderFormattedDate(activityDetails.created_at)}, ${renderFormattedTime(activityDetails.created_at ?? "")}`}
                >
                  <span className="whitespace-nowrap text-custom-text-350">
                    {" "}
                    {calculateTimeAgo(activityDetails.created_at)}
                  </span>
                </Tooltip>
              </span>
            </div>
            {descriptionContent}
          </div>
        </>
      )}
    </div>
  );
});
