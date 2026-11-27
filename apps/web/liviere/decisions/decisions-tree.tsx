/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: area tree of the decision register, with counts of the decisions passing the filters.
// The mechanisms of the selected area unfold under it.

import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { mechanismKey } from "./model";
import type { TTreeCounts } from "./model";
import type { TDecisionArea } from "./types";

type Props = {
  areas: TDecisionArea[];
  counts: TTreeCounts;
  area: string | null;
  mech: string | null;
  onSelect: (area: string | null, mech: string | null) => void;
};

function TreeItem(props: { label: string; count: number; current: boolean; nested?: boolean; onClick: () => void }) {
  const { label, count, current, nested, onClick } = props;
  return (
    <button
      type="button"
      aria-current={current ? "true" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-13",
        nested && "pl-6 text-12",
        current ? "bg-accent-subtle font-medium text-accent-primary" : "text-primary hover:bg-layer-transparent-hover",
        !current && count === 0 && "text-tertiary"
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 text-tertiary tabular-nums">{count}</span>
    </button>
  );
}

export function DecisionsTree(props: Props) {
  const { areas, counts, area, mech, onSelect } = props;
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("liviere.decisions.tree.label")}
      className="max-h-56 overflow-y-auto rounded-lg border border-subtle bg-surface-1 p-1.5 md:max-h-[calc(100vh-12rem)]"
    >
      <TreeItem
        label={t("liviere.decisions.tree.all")}
        count={counts.total}
        current={!area}
        onClick={() => onSelect(null, null)}
      />
      {areas.map((item) => (
        <div key={item.key}>
          <TreeItem
            label={item.name}
            count={counts.areas.get(item.key) ?? 0}
            current={area === item.key && !mech}
            onClick={() => onSelect(item.key, null)}
          />
          {area === item.key &&
            item.mechanisms.map((mechanism) => (
              <TreeItem
                key={mechanism.key}
                nested
                label={mechanism.name}
                count={counts.mechanisms.get(mechanismKey(item.key, mechanism.key)) ?? 0}
                current={mech === mechanism.key}
                onClick={() => onSelect(item.key, mech === mechanism.key ? null : mechanism.key)}
              />
            ))}
        </div>
      ))}
    </nav>
  );
}
