/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * `WorkloadDimensionSwap` — the single, narrow picker the §7.3 H card exposes
 * to swap its row dimension between Assignee / Label / Project / Module / Cycle.
 *
 * It replaces the generic Configure popover for `workload_by_assignee` only,
 * because that card's only useful tweak is "the same bar read along a
 * different row key"; every other tweak the old popover offered is locked to
 * a product default at the registry level (§9). KPI / delivery / distribution
 * cards ship no control beyond Export CSV (§7.1 / §7.4).
 */

import { useTranslation } from "@plane/i18n";
import { CustomSearchSelect } from "@plane/ui";
import type { TAnalyticsDimensionKey } from "@plane/types";
import { DASHBOARD_DIMENSION_LABELS } from "./card-registry";

const ALLOWED: TAnalyticsDimensionKey[] = ["assignees", "labels", "project", "module", "cycle"];

type Props = { value: TAnalyticsDimensionKey; onChange: (next: TAnalyticsDimensionKey) => void };

export function WorkloadDimensionSwap({ value, onChange }: Props) {
  const { t } = useTranslation();
  const options = ALLOWED.map((key) => ({
    value: key,
    query: DASHBOARD_DIMENSION_LABELS[key],
    content: <span>{DASHBOARD_DIMENSION_LABELS[key]}</span>,
  }));
  return (
    <CustomSearchSelect
      value={[value]}
      onChange={(v: string[]) => onChange(v[0] as TAnalyticsDimensionKey)}
      options={options}
      label={DASHBOARD_DIMENSION_LABELS[value]}
      selectedContent={(_v, option) => (
        <span className="flex items-center gap-1">
          <span className="text-tertiary">{t("dashboard_v3.control.dimension")}</span>
          <span className="text-tertiary">·</span>
          <span className="font-medium">{option?.query ?? DASHBOARD_DIMENSION_LABELS[value]}</span>
        </span>
      )}
    />
  );
}
