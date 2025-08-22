import { observer } from "mobx-react";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActivityListItem } from "./list-item";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarActivityList: React.FC<Props> = observer((props) => {
  const { automationId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const { activityIds } = automation?.activity ?? {};

  return (
    <div className="px-6">
      {activityIds?.map((activityId) => (
        <AutomationDetailsSidebarActivityListItem
          key={activityId}
          activityId={activityId}
          automationId={automationId}
        />
      ))}
    </div>
  );
});
