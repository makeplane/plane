import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarContent } from "./content";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarRoot: React.FC<Props> = observer((props) => {
  const { automationId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const { sidebarHelper } = getAutomationById(automationId) ?? {};
  const selectedSidebarTab = sidebarHelper?.selectedSidebarConfig?.tab;

  return (
    <aside
      className={cn(
        "flex-shrink-0 h-full w-[400px] -mr-[400px] flex flex-col border-l border-custom-border-200 space-y-6 overflow-y-scroll vertical-scrollbar scrollbar-sm transition-all",
        {
          "mr-0": !!selectedSidebarTab,
        }
      )}
    >
      <AutomationDetailsSidebarContent automationId={automationId} />
    </aside>
  );
});
