import { Dot, X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// local imports
import type { TPowerKContextType } from "../../core/types";
import { CONTEXT_ENTITY_MAP } from "../pages/context-based-actions";

type Props = {
  activeContext: TPowerKContextType | null;
  handleClearContext: () => void;
};

export const PowerKModalContextIndicator: React.FC<Props> = (props) => {
  const { activeContext, handleClearContext } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const contextEntity = activeContext ? CONTEXT_ENTITY_MAP[activeContext] : null;

  if (!activeContext || !contextEntity) return null;

  return (
    <div className="w-full px-4 pt-3 pb-2">
      <div className="max-w-full bg-custom-background-80 px-2 py-0.5 rounded inline-flex items-center gap-1 truncate">
        <div className="flex items-center gap-1.5 text-xs font-medium truncate">
          <span className="shrink-0 text-custom-text-200">{t(contextEntity.i18n_indicator)}</span>
          <span className="shrink-0 bg-custom-text-200 size-1 rounded-full" />
          <p className="truncate">Some random name here</p>
        </div>
        <button
          type="button"
          onClick={handleClearContext}
          className="shrink-0 grid place-items-center p-1 text-custom-text-200 hover:text-custom-text-100 transition-colors"
          title="Clear context (Backspace)"
          aria-label="Clear context (Backspace)"
          tabIndex={-1}
        >
          <X className="size-2.5" />
        </button>
      </div>
    </div>
  );
};
