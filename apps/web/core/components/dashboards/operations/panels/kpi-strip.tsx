/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TKpiCounts } from "@plane/types";

interface Props {
  data: TKpiCounts | null;
  isLoading: boolean;
  error: boolean;
}

interface Kpi {
  id: keyof TKpiCounts;
  label: string;
  /** Accent border colour (3px top accent). */
  accentClass: string;
  /** Inline SVG icon shown above the value. */
  icon: React.ReactNode;
}

const KPIS: Kpi[] = [
  {
    id: "total",
    label: "Total work items",
    accentClass: "border-t-accent-blue",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <path d="M2 6h12M6 2v12" />
      </svg>
    ),
  },
  {
    id: "completed",
    label: "Completed",
    accentClass: "border-t-accent-green",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8.5l3 3 7-7" />
      </svg>
    ),
  },
  {
    id: "started",
    label: "In progress",
    accentClass: "border-t-accent-amber",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4v4l2.5 2.5" />
      </svg>
    ),
  },
  {
    id: "not_started",
    label: "Not started",
    accentClass: "border-t-accent-gray",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
      </svg>
    ),
  },
  {
    id: "blocked",
    label: "Blocked",
    accentClass: "border-t-accent-purple",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
        <path d="M5 5l6 6M11 5l-6 6" />
      </svg>
    ),
  },
  {
    id: "overdue",
    label: "Overdue",
    accentClass: "border-t-accent-red",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 3v5l3 2" />
        <circle cx="8" cy="8" r="6" />
      </svg>
    ),
  },
];

export function KpiStrip({ data, isLoading, error }: Props): React.ReactElement {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      data-testid="kpi-strip"
      aria-label="Snapshot KPIs"
    >
      {KPIS.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} value={data?.[kpi.id]} isLoading={isLoading} error={error} />
      ))}
    </div>
  );
}

interface KpiCardProps {
  kpi: Kpi;
  value: number | undefined;
  isLoading: boolean;
  error: boolean;
}

function KpiCard({ kpi, value, isLoading, error }: KpiCardProps): React.ReactElement {
  const display = error ? "—" : isLoading || value === undefined ? "…" : formatCount(value);
  // Period completion: the % of total work items in this bucket.
  const total = undefined;
  return (
    <div
      className={`flex min-h-[88px] flex-col justify-between gap-1 rounded-md border border-subtle border-t-2 ${kpi.accentClass} bg-layer-1 px-3 py-2.5`}
      data-testid={`kpi-${kpi.id}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-tertiary" aria-hidden="true">{kpi.icon}</span>
        <span className="text-11 text-tertiary">{kpi.label}</span>
      </div>
      <div className="flex items-baseline justify-between gap-1.5">
        <span className="font-mono text-22 font-semibold tabular-nums text-primary">{display}</span>
        {value !== undefined && !error ? (
          <span className="text-11 tabular-nums text-tertiary" data-testid={`kpi-${kpi.id}-secondary`}>
            {total !== undefined ? `${Math.round((value / total) * 100)}%` : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}