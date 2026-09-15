/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import type { TLiteratureThreshold } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  threshold?: TLiteratureThreshold;
};

/** Included count against the configured threshold, plus the entry cap. */
export const LiteratureThresholdPanel = observer(function LiteratureThresholdPanel({ threshold }: Props) {
  const { t } = useTranslation();
  if (!threshold) return null;
  const { counters } = threshold;
  const progress = Math.min(100, Math.round((counters.included / Math.max(threshold.threshold.min_included, 1)) * 100));

  return (
    <div className="flex flex-wrap items-center gap-4 rounded border border-subtle px-3 py-2">
      <div className="flex flex-col gap-1">
        <span className="text-12 text-secondary">
          {t("research.literature.threshold_hint", {
            included: counters.included,
            required: threshold.threshold.min_included,
          })}
        </span>
        <div className="h-1.5 w-48 overflow-hidden rounded bg-surface-2">
          <div
            className={`h-full ${counters.included >= threshold.threshold.min_included ? "bg-success-primary" : "bg-accent-primary"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {threshold.remaining > 0 && (
          <span className="text-11 text-tertiary">
            {t("research.literature.remaining", { count: threshold.remaining })}
          </span>
        )}
      </div>
      <span className="text-12 text-tertiary">
        {t("research.literature.capacity", { total: counters.total, max: threshold.threshold.max_entries })}
      </span>
      <span className="text-12 text-tertiary">
        {t("research.literature.quality_hint", { count: counters.unannotated_count })}
      </span>
    </div>
  );
});
