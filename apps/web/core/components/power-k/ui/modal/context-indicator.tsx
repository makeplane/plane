import { X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// local imports
import type { TPowerKContextType } from "../../core/types";
import { useContextIndicator } from "../../hooks/use-context-indicator";
import { CONTEXT_ENTITY_MAP } from "../pages/context-based";

type Props = {
  activeContext: TPowerKContextType | null;
  handleClearContext: () => void;
};

export function PowerKModalContextIndicator(props: Props) {
  const { activeContext, handleClearContext } = props;
  // context indicator
  const contextIndicator = useContextIndicator({ activeContext });
  // translation
  const { t } = useTranslation();
  // derived values
  const contextEntity = activeContext ? CONTEXT_ENTITY_MAP[activeContext] : null;

  if (!activeContext || !contextEntity) return null;

  return (
    <div className="w-full px-4 pt-3 pb-2">
      <div className="max-w-full bg-layer-1 pl-2 pr-1 py-0.5 rounded-sm inline-flex items-center gap-1 truncate">
        <div className="flex items-center gap-1.5 text-11 font-medium truncate">
          <span className="shrink-0 text-secondary">{t(contextEntity.i18n_indicator)}</span>
          <span className="shrink-0 bg-layer-1 size-1 rounded-full" />
          <p className="truncate">{contextIndicator}</p>
        </div>
        <button
          type="button"
          onClick={handleClearContext}
          className="shrink-0 grid place-items-center p-1 text-secondary hover:text-primary transition-colors"
          title="Clear context (Backspace)"
          aria-label="Clear context (Backspace)"
          tabIndex={-1}
        >
          <X className="size-2.5" />
        </button>
      </div>
    </div>
  );
}
