import { observer } from "mobx-react";
// plane imports
import { EAutomationSidebarTab } from "@plane/types";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActionRoot } from "./actions/root";
import { AutomationDetailsSidebarActivityRoot } from "./activity/root";
import { AutomationDetailsSidebarFooter } from "./footer";
import { AutomationDetailsSidebarHeader } from "./header";
import { AutomationDetailsSidebarTriggerRoot } from "./trigger/root";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarContent: React.FC<Props> = observer((props) => {
  const { automationId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const sidebarHelper = automation?.sidebarHelper;
  const selectedSidebarTab = sidebarHelper?.selectedSidebarConfig?.tab;

  const renderSidebarContent = () => {
    switch (selectedSidebarTab) {
      case EAutomationSidebarTab.ACTION:
        return <AutomationDetailsSidebarActionRoot automationId={automationId} />;
      case EAutomationSidebarTab.TRIGGER:
        return <AutomationDetailsSidebarTriggerRoot automationId={automationId} />;
      case EAutomationSidebarTab.ACTIVITY:
        return <AutomationDetailsSidebarActivityRoot automationId={automationId} />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 mb-2">
        <AutomationDetailsSidebarHeader automationId={automationId} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden overflow-y-auto vertical-scrollbar scrollbar-sm">
        <div className="my-2 flex-1">{renderSidebarContent()}</div>
        <div className="my-2">
          <AutomationDetailsSidebarFooter automationId={automationId} />
        </div>
      </div>
    </div>
  );
});
