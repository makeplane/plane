/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { STAGE_TYPES, STAGE_TYPE_LABELS, INTEGRATION_SYSTEMS, INTEGRATION_SYSTEM_LABELS } from "@plane/constants";
import type { TTimelineFilters } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/ui";

type Props = {
  filters: TTimelineFilters;
  onChange: (filters: TTimelineFilters) => void;
};

/** Filters: chain, stage, time range and source system (P1-CHAIN-06). */
export const ChainFilters = observer(function ChainFilters({ filters, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["", "thinking", "development"] as const).map((value) => (
        <button
          key={value || "all"}
          type="button"
          onClick={() => onChange({ ...filters, chain: value || undefined })}
          className={`rounded px-2 py-1 text-12 ${
            (filters.chain ?? "") === value ? "bg-surface-2 text-primary" : "text-tertiary hover:bg-surface-2"
          }`}
        >
          {t(value ? `research.timeline.chain.${value}` : "research.timeline.chain.all")}
        </button>
      ))}
      <select
        className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
        value={filters.stage ?? ""}
        onChange={(event) => onChange({ ...filters, stage: event.target.value || undefined })}
      >
        <option value="">{t("research.timeline.all_stages")}</option>
        {STAGE_TYPES.map((value) => (
          <option key={value} value={value}>
            {t(STAGE_TYPE_LABELS[value])}
          </option>
        ))}
      </select>
      <select
        className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-12 text-primary"
        value={filters.source_system ?? ""}
        onChange={(event) => onChange({ ...filters, source_system: event.target.value || undefined })}
      >
        <option value="">{t("research.timeline.all_sources")}</option>
        {INTEGRATION_SYSTEMS.map((value) => (
          <option key={value} value={value}>
            {t(INTEGRATION_SYSTEM_LABELS[value])}
          </option>
        ))}
      </select>
      <Input
        className="!w-36"
        type="date"
        value={filters.date_from ?? ""}
        onChange={(event) => onChange({ ...filters, date_from: event.target.value || undefined })}
      />
      <Input
        className="!w-36"
        type="date"
        value={filters.date_to ?? ""}
        onChange={(event) => onChange({ ...filters, date_to: event.target.value || undefined })}
      />
    </div>
  );
});
