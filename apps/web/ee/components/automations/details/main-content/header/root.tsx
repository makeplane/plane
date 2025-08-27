import { observer } from "mobx-react";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TProps = {
  automationId: string;
};

export const AutomationDetailsMainContentHeader: React.FC<TProps> = observer((props) => {
  const { automationId } = props;
  // store hooks
  const {
    getAutomationById,
    projectAutomations: { setCreateUpdateModalConfig },
  } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId)?.asJSON;

  if (!automation) return null;
  return (
    <header>
      <h2 className="flex-grow text-xl text-custom-text-200 font-medium truncate">{automation.name}</h2>
      {automation.description && (
        <p className="mt-1 text-xs text-custom-text-300 line-clamp-2">{automation.description}</p>
      )}
    </header>
  );
});
