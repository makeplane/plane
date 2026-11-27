/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: decision cards of the "Areas" view, grouped by area, or by mechanism within an area.

import { useTranslation } from "@plane/i18n";
import { DecisionCard } from "./decision-card";
import type { TDecisionsContext } from "./decisions-root";
import { groupDecisions } from "./model";
import type { TDecisionGroup } from "./model";
import type { TDecision, TDecisionArea } from "./types";

type Props = {
  context: TDecisionsContext;
  decisions: TDecision[];
  areas: TDecisionArea[];
  area: string | null;
  isOpen: (number: number) => boolean;
  onToggle: (number: number) => void;
  // Search hits the status filter hides
  hiddenByStatus: number;
  onShowAllStates: () => void;
};

export function DecisionsList(props: Props) {
  const { context, decisions, areas, area, isOpen, onToggle, hiddenByStatus, onShowAllStates } = props;
  const { t } = useTranslation();
  const groups = groupDecisions(decisions, areas, area);

  const groupLabel = (group: TDecisionGroup) => {
    if (group.type === "area") return context.areaNames.get(group.area) ?? group.area;
    if (group.type === "secondary")
      return t("liviere.decisions.groups.from_area", { area: context.areaNames.get(group.area) ?? group.area });
    if (!group.mechanism) return t("liviere.decisions.groups.general");
    return context.mechanismNames.get(area ?? "")?.get(group.mechanism) ?? group.mechanism;
  };

  const more = hiddenByStatus > 0 && (
    <p className="text-13 text-tertiary">
      {t("liviere.decisions.search.other_states", { count: hiddenByStatus })}{" "}
      <button type="button" className="text-accent-primary hover:underline" onClick={onShowAllStates}>
        {t("liviere.decisions.search.show_all_states")}
      </button>
    </p>
  );

  if (!groups.length)
    return (
      <section className="flex flex-col gap-3">
        <div className="rounded-lg border border-dashed border-subtle bg-surface-1 px-6 py-8 text-center text-13 text-tertiary">
          {t("liviere.decisions.empty")}
        </div>
        {more}
      </section>
    );

  return (
    <section className="flex min-w-0 flex-col gap-5">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <h2 className="text-12 font-medium tracking-wide text-tertiary uppercase">
            {groupLabel(group)} · {group.items.length}
          </h2>
          {group.items.map((decision) => (
            <DecisionCard
              key={decision.number}
              context={context}
              decision={decision}
              open={isOpen(decision.number)}
              onToggle={() => onToggle(decision.number)}
              currentArea={area}
            />
          ))}
        </div>
      ))}
      {more}
    </section>
  );
}
