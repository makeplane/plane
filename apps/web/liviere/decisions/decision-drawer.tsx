/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: side panel of the decision map: the opened decision's card with the same actions as in
// the list. Esc or "Close" closes it; on a phone it takes the whole width.

import { useEffect } from "react";
import { Button } from "@makeplane/propel/components/button";
import { useTranslation } from "@plane/i18n";
import { DecisionCard } from "./decision-card";
import type { TDecisionsContext } from "./decisions-root";
import type { TDecision } from "./types";

type Props = {
  context: TDecisionsContext;
  decision: TDecision;
  onClose: () => void;
};

export function DecisionDrawer(props: Props) {
  const { context, decision, onClose } = props;
  const { t } = useTranslation();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Not while a dialog of an action is open: it closes itself first
      if (event.key === "Escape" && !document.querySelector("[role='dialog']")) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  const mechanism = decision.mechanism ? context.mechanismNames.get(decision.area)?.get(decision.mechanism) : null;
  return (
    <aside
      aria-label={decision.identifier}
      className="fixed inset-y-0 right-0 z-30 flex w-full flex-col gap-3 overflow-y-auto border-l border-subtle bg-surface-1 p-4 shadow-raised-200 sm:w-[460px]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-12 text-tertiary">
          {context.areaNames.get(decision.area) ?? decision.area}
          {mechanism ? ` › ${mechanism}` : ""}
        </span>
        <Button
          variant="secondary"
          size="sm"
          stretch="auto"
          label={t("liviere.decisions.map.close")}
          onClick={onClose}
        />
      </div>
      <DecisionCard context={context} decision={decision} open inDrawer />
    </aside>
  );
}
