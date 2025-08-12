import { observer } from "mobx-react";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsMainContentActionsRoot } from "./actions/root";
import { AutomationDetailsMainContentHeader } from "./header/root";
import { AutomationDetailsMainContentLoader } from "./loader";
import { AutomationDetailsMainContentScopeRoot } from "./scope/root";
import { AutomationDetailsMainContentTriggerRoot } from "./trigger/root";

type TProps = {
  automationId: string;
};

export const AutomationDetailsMainContentRoot: React.FC<TProps> = observer((props) => {
  const { automationId } = props;
  // store hooks
  const {
    getAutomationById,
    projectAutomations: { getFetchStatusById },
  } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const isAutomationLoaded = getFetchStatusById(automationId);

  return (
    <main className="@container flex-shrink-0 flex-grow flex justify-center bg-custom-background-90 px-page-x py-6 overflow-y-scroll vertical-scrollbar scrollbar-sm">
      <div className="@lg:w-4/5 @xl:w-3/5 @3xl:w-2/5 space-y-6">
        {isAutomationLoaded ? (
          <>
            <AutomationDetailsMainContentHeader automationId={automationId} />
            <AutomationDetailsMainContentScopeRoot automationId={automationId} />
            {automation?.scope && <AutomationDetailsMainContentTriggerRoot automationId={automationId} />}
            {automation?.isTriggerNodeAvailable && (
              <AutomationDetailsMainContentActionsRoot automationId={automationId} />
            )}
          </>
        ) : (
          <AutomationDetailsMainContentLoader />
        )}
      </div>
    </main>
  );
});
