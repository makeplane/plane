/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Per-card query configuration (spec §9).
 *
 * The dashboard is not a query builder: a card renders only the controls it
 * declared in its registry entry, and every option is a key the Analytics V2
 * registries already accept. A change here is written against one card id, so
 * only that card's slice of the batch payload moves (§20).
 *
 * Post-RD-486: the generic Configure popover is gone. Only one card
 * (`workload_by_assignee` §7.3 H) needs a header control — the narrow
 * `WorkloadDimensionSwap` re-exported below. Every other card shows only the
 * Export CSV button next to its title.
 */

import { ANALYTICS_DATE_BASIS_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TCardDefinition } from "./card-registry";

export { WorkloadDimensionSwap } from "./WorkloadDimensionSwap";

/** §8.2 — shown when a card pins its own date basis instead of the global one. */
export function CardDateBasisOverrideLabel({ card }: { card: TCardDefinition }) {
  const { t } = useTranslation();
  if (!card.semanticDateBasis) return null;
  // Surface the human-readable label (e.g. "Completed date") rather than the
  // raw engine token (`completed_at`) so the i18n string interpolates into a
  // sentence the viewer can actually read.
  const basisLabel =
    ANALYTICS_DATE_BASIS_OPTIONS.find((option) => option.value === card.semanticDateBasis)?.label ??
    card.semanticDateBasis;
  return (
    <span className="text-11 text-tertiary" data-testid={`dashboard-v3-basis-${card.id}`}>
      {t("dashboard_v3.card.basis_override", { basis: basisLabel })}
    </span>
  );
}
