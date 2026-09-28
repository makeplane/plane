/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TKpiCounts, TSnapshotRule } from "@plane/types";

interface Props {
  data: TKpiCounts | null;
  isLoading: boolean;
  error: boolean;
  /** Click handler — opens the operational items drawer for the metric. */
  onMetricClick?: (metric: TSnapshotRule) => void;
}

interface KpiSecondary {
  /** Computed fraction (0..1) of this KPI against its denominator. */
  fraction: number;
  /** Human-readable denominator label, e.g. "of open" / "of total". */
  denominatorLabel: string;
  /** Stroke colour for the ring track. */
  colour: string;
}

interface Kpi {
  id: keyof TKpiCounts;
  label: string;
  /** Accent border colour (3px top accent) — Tailwind v4 token. */
  accentClass: string;
  /** Inline SVG icon shown above the value. */
  icon: React.ReactNode;
  /** Snapshot rule key for the items drilldown selection. */
  metric: TSnapshotRule;
  /**
   * Optional secondary ring — fraction of THIS kpi against a
   * denominator. Pure function of `data` so each render computes
   * it independently (no shared workspace state).
   */
  secondary?: (data: TKpiCounts) => KpiSecondary | null;
}

const KPIS: Kpi[] = [
  {
    id: "total",
    label: "Total work items",
    accentClass: "border-t-blue-500",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="12" height="12" rx="2" />
        <path d="M2 6h12M6 2v12" />
      </svg>
    ),
    metric: "total",
    secondary: (d) =>
      d.total === 0 ? null : { fraction: d.open / d.total, denominatorLabel: "open", colour: "#3b82f6" },
  },
  {
    id: "completed",
    label: "Completed",
    accentClass: "border-t-green-500",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8.5l3 3 7-7" />
      </svg>
    ),
    metric: "completed",
    // Spec §6.4: completion rate excludes cancelled work items.
    // `total - cancelled` is the right denominator.
    secondary: (d) => {
      const denom = d.total - d.cancelled;
      return denom === 0
        ? null
        : {
            fraction: d.completed / denom,
            denominatorLabel: "of total − cancelled",
            colour: "#22c55e",
          };
    },
  },
  {
    id: "started",
    label: "In progress",
    accentClass: "border-t-amber-500",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 4v4l2.5 2.5" />
      </svg>
    ),
    metric: "started",
    secondary: (d) =>
      d.open === 0 ? null : { fraction: d.started / d.open, denominatorLabel: "of open", colour: "#f59e0b" },
  },
  {
    id: "not_started",
    label: "Not started",
    accentClass: "border-t-neutral-500",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
      </svg>
    ),
    metric: "not_started",
    secondary: (d) =>
      d.open === 0 ? null : { fraction: d.not_started / d.open, denominatorLabel: "of open", colour: "#9ca3af" },
  },
  {
    id: "blocked",
    label: "Blocked",
    accentClass: "border-t-purple-500",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6" />
        <path d="M5 5l6 6M11 5l-6 6" />
      </svg>
    ),
    metric: "blocked",
    secondary: (d) =>
      d.open === 0 ? null : { fraction: d.blocked / d.open, denominatorLabel: "of open", colour: "#a855f7" },
  },
  {
    id: "overdue",
    label: "Overdue",
    accentClass: "border-t-red-500",
    icon: (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 3v5l3 2" />
        <circle cx="8" cy="8" r="6" />
      </svg>
    ),
    metric: "overdue",
    secondary: (d) =>
      d.open === 0 ? null : { fraction: d.overdue / d.open, denominatorLabel: "of open", colour: "#ef4444" },
  },
];

export function KpiStrip({ data, isLoading, error, onMetricClick }: Props): React.ReactElement {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      data-testid="kpi-strip"
      aria-label="Snapshot KPIs"
    >
      {KPIS.map((kpi) => (
        <KpiCard
          key={kpi.id}
          kpi={kpi}
          value={data?.[kpi.id]}
          isLoading={isLoading}
          error={error}
          secondary={!error && !isLoading && data ? (kpi.secondary?.(data) ?? null) : null}
          onClick={onMetricClick ? () => onMetricClick(kpi.metric) : undefined}
        />
      ))}
    </div>
  );
}

interface KpiCardProps {
  kpi: Kpi;
  value: number | undefined;
  isLoading: boolean;
  error: boolean;
  secondary: KpiSecondary | null;
  onClick: (() => void) | undefined;
}

function KpiCard({ kpi, value, isLoading, error, secondary, onClick }: KpiCardProps): React.ReactElement {
  const display = error ? "—" : isLoading || value === undefined ? "…" : formatCount(value);
  const isInteractive = onClick !== undefined;
  const baseClasses = `flex min-h-[88px] flex-col justify-between gap-1 rounded-md border border-subtle border-t-2 ${kpi.accentClass} bg-layer-1 px-3 py-2.5`;
  const interactiveClasses = isInteractive
    ? "cursor-pointer transition-colors hover:bg-layer-2 focus:outline-none focus:ring-2 focus:ring-accent"
    : "";
  const Component = isInteractive ? "button" : "div";
  return (
    <Component
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      className={`${baseClasses} ${interactiveClasses}`}
      data-testid={`kpi-${kpi.id}`}
      aria-label={isInteractive ? `${kpi.label}: ${display}. Open drilldown.` : `${kpi.label}: ${display}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-tertiary" aria-hidden="true">
          {kpi.icon}
        </span>
        <span className="text-11 text-tertiary">{kpi.label}</span>
      </div>
      <div className="flex items-baseline justify-between gap-1.5">
        <span className="font-mono text-22 font-semibold text-primary tabular-nums">{display}</span>
        {secondary ? (
          <Ring secondary={secondary} />
        ) : isInteractive ? (
          <span className="text-11 text-tertiary" aria-hidden="true">
            →
          </span>
        ) : null}
      </div>
      {secondary ? (
        <div
          className="flex items-center justify-between gap-1.5 text-11 text-tertiary"
          data-testid={`kpi-${kpi.id}-secondary`}
        >
          <span>
            {Math.round(secondary.fraction * 100)}% {secondary.denominatorLabel}
          </span>
        </div>
      ) : null}
    </Component>
  );
}

/**
 * Tiny progress ring drawn on a 12×12 viewBox; the visible
 * fraction is the value arc, the complement is the empty track.
 */
function Ring({ secondary }: { secondary: KpiSecondary }): React.ReactElement {
  const r = 5;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, secondary.fraction));
  const dash = `${clamped * c} ${c}`;
  return (
    <svg viewBox="0 0 12 12" width="14" height="14" aria-hidden="true">
      <circle cx="6" cy="6" r={r} stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" fill="none" />
      <circle
        cx="6"
        cy="6"
        r={r}
        stroke={secondary.colour}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={dash}
        transform="rotate(-90 6 6)"
      />
    </svg>
  );
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
