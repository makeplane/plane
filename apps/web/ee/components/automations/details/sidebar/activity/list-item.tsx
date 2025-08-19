import { observer } from "mobx-react";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActivityListItemWrapper } from "./list-item-wrapper";
import { useAutomationActivity } from "./use-automation-activity";

type Props = {
  automationId: string;
  activityId: string;
};

export const AutomationDetailsSidebarActivityListItem: React.FC<Props> = observer((props) => {
  const { automationId, activityId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const { getActivityById } = automation?.activity ?? {};
  const activityDetails = getActivityById?.(activityId);

  if (!activityDetails) return null;

  const { activityListItemDetails } = useAutomationActivity({
    activityId,
    automationId,
  });
  if (!activityListItemDetails) return null;

  return (
    <AutomationDetailsSidebarActivityListItemWrapper
      automationId={automationId}
      activityId={activityId}
      descriptionContent={activityListItemDetails.descriptionContent}
      icon={activityListItemDetails.icon}
      titleContent={activityListItemDetails.titleContent}
    />
  );
});
