import { observer } from "mobx-react";
import useSWR from "swr";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActivityList } from "./list";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarActivityRoot: React.FC<Props> = observer((props) => {
  const { automationId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const { fetchActivities, filtersFetchKey, hasFetchedActivities } = automation?.activity ?? {};

  useSWR(`AUTOMATION_ACTIVITY_${automationId}_${filtersFetchKey}`, () => fetchActivities?.());

  if (!hasFetchedActivities) return null;

  return <AutomationDetailsSidebarActivityList automationId={automationId} />;
});
