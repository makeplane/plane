import React from "react";
import { Command } from "cmdk";
import { X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
// plane imports
import { SearchIcon } from "@plane/propel/icons";
// local imports
import type { TPowerKContext, TPowerKPageType } from "../../core/types";
import { POWER_K_MODAL_PAGE_DETAILS } from "./constants";
import { PowerKModalContextIndicator } from "./context-indicator";

type Props = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  onSearchChange: (value: string) => void;
  searchTerm: string;
};

export function PowerKModalHeader(props: Props) {
  const { context, searchTerm, onSearchChange, activePage } = props;
  // translation
  const { t } = useTranslation();
  // derived values
  const placeholder = activePage
    ? t(POWER_K_MODAL_PAGE_DETAILS[activePage].i18n_placeholder)
    : t("power_k.page_placeholders.default");

  return (
    <div className="border-b border-subtle">
      {/* Context Indicator */}
      {context.shouldShowContextBasedActions && !activePage && (
        <PowerKModalContextIndicator
          activeContext={context.activeContext}
          handleClearContext={() => context.setShouldShowContextBasedActions(false)}
        />
      )}

      {/* Search Input */}
      <div className="flex items-center gap-2 px-4 py-3">
        <SearchIcon className="shrink-0 size-4 text-placeholder" />
        <Command.Input
          value={searchTerm}
          onValueChange={onSearchChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-13 text-primary placeholder-(--text-color-placeholder) outline-none"
          autoFocus
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
            className="flex-shrink-0 rounded-sm p-1 text-placeholder hover:bg-layer-1 hover:text-secondary"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
