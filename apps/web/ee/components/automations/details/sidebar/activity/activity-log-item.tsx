import { observer } from "mobx-react";
import { Repeat } from "lucide-react";
// plane imports
import { usePlatformOS } from "@plane/hooks";
import { Tooltip } from "@plane/ui";
import { calculateTimeAgo, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { getAutomationActivityListItemDetails } from "./activity.helper";

type Props = {
  automationId: string;
  activityId: string;
};

export const AutomationDetailsSidebarActivityLogItem: React.FC<Props> = observer((props) => {
  const { automationId, activityId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  const { getUserDetails } = useMember();
  // derived values
  const automation = getAutomationById(automationId);
  const { getActivityById } = automation?.activity ?? {};
  const activityDetails = getActivityById?.(activityId);
  const activityActorDetails = activityDetails?.actor ? getUserDetails(activityDetails?.actor) : undefined;
  // platform check
  const { isMobile } = usePlatformOS();
  if (!activityDetails) return null;
  const activityListItemDetails = getAutomationActivityListItemDetails(activityDetails);
  if (!activityListItemDetails) return null;
  const ActivityIcon = activityListItemDetails.icon ?? Repeat;

  return (
    <>
      <div className="shrink-0 ring-6 size-7 rounded-full overflow-hidden grid place-items-center z-[4] bg-custom-background-80 text-custom-text-200 border-2 border-transparent transition-border duration-1000">
        <ActivityIcon className="size-3.5" />
      </div>
      <div className="w-full">
        <div className="text-custom-text-200">
          <span>{activityActorDetails?.display_name}</span>
          <span> {activityListItemDetails.titleContent} </span>
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
        {activityListItemDetails.descriptionContent}
      </div>
    </>
  );
});
