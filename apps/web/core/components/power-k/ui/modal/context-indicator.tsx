/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
      <div className="inline-flex max-w-full items-center gap-1 truncate rounded-sm bg-layer-1 py-0.5 pr-1 pl-2">
        <div className="flex items-center gap-1.5 truncate text-11 font-medium">
          <span className="shrink-0 text-secondary">{t(contextEntity.i18n_indicator)}</span>
          <span className="size-1 shrink-0 rounded-full bg-layer-1" />
          <p className="truncate">{contextIndicator}</p>
        </div>
        <button
          type="button"
          onClick={handleClearContext}
          className="grid shrink-0 place-items-center p-1 text-secondary transition-colors hover:text-primary"
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
