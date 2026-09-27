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
  primary: boolean;
  sublabel?: string;
}

const KPIS: Kpi[] = [
  { id: "total", label: "Total work items", primary: true },
  { id: "completed", label: "Completed", primary: false },
  { id: "started", label: "In progress", primary: false },
  { id: "not_started", label: "Not started", primary: false },
  { id: "blocked", label: "Blocked", primary: false },
  { id: "overdue", label: "Overdue", primary: false },
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
  return (
    <div
      className="flex min-h-[88px] flex-col justify-between rounded-md border border-subtle bg-layer-1 p-3"
      data-testid={`kpi-${kpi.id}`}
    >
      <span className="text-12 text-tertiary">{kpi.label}</span>
      <span className="font-mono text-26 font-semibold text-primary tabular-nums">{display}</span>
    </div>
  );
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
