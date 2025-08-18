import { observer } from "mobx-react";
import { Pencil } from "lucide-react";
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex-grow text-xl text-custom-text-200 font-medium truncate">{automation.name}</h2>
        <button
          type="button"
          className="flex-shrink-0 size-4 grid place-items-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors"
          aria-label="Edit automation details"
          onClick={() => {
            setCreateUpdateModalConfig({ isOpen: true, payload: automation });
          }}
        >
          <Pencil className="size-3" />
        </button>
      </div>
      {automation.description && (
        <p className="mt-1 text-xs text-custom-text-300 line-clamp-2">{automation.description}</p>
      )}
    </header>
  );
});
