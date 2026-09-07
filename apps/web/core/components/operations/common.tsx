/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * The small vocabulary every Engineering Operations screen is built from.
 *
 * Deliberately plain: tiles, sections, bar rows and one hand-drawn SVG line.
 * The dashboards are read at a glance and refreshed constantly, so nothing
 * here animates, fetches, or depends on a charting runtime.
 */

import type { ReactNode } from "react";
import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";
import { cn } from "@workspaces/utils";

// ---------------------------------------------------------------- Formatters

/** Odoo-style fractional hours (`5.1`) as `5h 06m`. */
export const formatHours = (hours: number | null | undefined): string => {
  if (hours === null || hours === undefined) return "--";
  const minutes = Math.max(0, Math.round(hours * 60));
  const wholeHours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return wholeHours > 0 ? `${wholeHours}h ${String(remainder).padStart(2, "0")}m` : `${remainder}m`;
};

export const formatDays = (days: number | null | undefined): string =>
  days === null || days === undefined ? "--" : `${days} ${days === 1 ? "day" : "days"}`;

export const formatPercent = (ratio: number | null | undefined, digits = 0): string =>
  ratio === null || ratio === undefined ? "--" : `${(ratio * 100).toFixed(digits)}%`;

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(parsed);
};

/** A timestamp as a clock time, in the reader's own zone. */
export const formatTime = (value: string | null | undefined): string => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(parsed);
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

/** `2026-09-04`, in the browser's zone — what every date input and API filter wants. */
export const toISODate = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toISODate(date);
};

// ------------------------------------------------------------------- Layout

type SectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Section({ title, description, action, children, className }: SectionProps) {
  return (
    <section className={cn("rounded-lg border border-subtle bg-layer-1", className)}>
      <header className="flex flex-col gap-2 border-b border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-13 font-semibold text-primary">{title}</h2>
          {description && <p className="mt-0.5 text-11 text-tertiary">{description}</p>}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export type TTileTone = "default" | "positive" | "warning" | "danger";

const TILE_TONE: Record<TTileTone, string> = {
  default: "text-primary",
  positive: "text-success-primary",
  warning: "text-warning-primary",
  danger: "text-danger-primary",
};

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: TTileTone;
  onClick?: () => void;
};

export function StatTile({ label, value, hint, tone = "default", onClick }: StatTileProps) {
  const content = (
    <>
      <div className="text-11 font-medium tracking-wide text-tertiary uppercase">{label}</div>
      <div className={cn("text-2xl mt-1 leading-none font-semibold tabular-nums", TILE_TONE[tone])}>{value}</div>
      {hint && <div className="mt-1 text-11 text-placeholder">{hint}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg border border-subtle bg-layer-1 p-3 text-left transition-colors hover:bg-layer-transparent-hover"
      >
        {content}
      </button>
    );
  }

  return <div className="rounded-lg border border-subtle bg-layer-1 p-3">{content}</div>;
}

export function TileGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6", className)}>{children}</div>;
}

// --------------------------------------------------------------- Bar display

export type TBarRow = { label: string; value: number; hint?: string; color?: string };

/**
 * A list of labelled bars, scaled to the largest value in the set.
 *
 * Scaled to the max rather than to a total: these are counts of unrelated
 * things (states, assignees, environments), and a percentage-of-total bar
 * would imply they add up to something.
 */
export function BarList({ rows, emptyLabel = "Nothing here yet" }: { rows: TBarRow[]; emptyLabel?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  if (rows.length === 0) return <EmptyPanel label={emptyLabel} compact />;

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-13 text-secondary sm:w-40" title={row.label}>
            {row.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-layer-3">
            <span
              className="block h-full rounded-full bg-accent-primary"
              style={{
                width: `${Math.round((row.value / max) * 100)}%`,
                backgroundColor: row.color,
              }}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-13 font-medium text-primary tabular-nums">{row.value}</span>
          {row.hint && <span className="w-16 shrink-0 text-right text-11 text-placeholder">{row.hint}</span>}
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ Burndown

type SparklineProps = {
  points: { date: string; value: number | null }[];
  height?: number;
  label?: string;
};

/**
 * A single-series line, drawn by hand.
 *
 * `null` values end the drawn line rather than dropping to zero — the
 * burndown's future has no measurement, and a line that dives to the axis on
 * the last day of a sprint reads as "everything shipped".
 */
export function Sparkline({ points, height = 120, label }: SparklineProps) {
  const measured = points.filter((point) => point.value !== null) as { date: string; value: number }[];
  if (measured.length < 2) return <EmptyPanel label="Not enough data to chart yet" compact />;

  const max = Math.max(...measured.map((point) => point.value), 1);
  const width = 100;
  const step = width / Math.max(1, points.length - 1);

  const path = measured
    .map((point, index) => {
      const x = points.indexOf(point) * step;
      const y = height - (point.value / max) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const first = points[0];
  const last = measured[measured.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-[120px] w-full"
        role="img"
        aria-label={label ?? "Trend"}
      >
        <line
          x1="0"
          y1={height - 0.5}
          x2={width}
          y2={height - 0.5}
          className="stroke-subtle"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          className="stroke-accent-primary"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1 flex justify-between text-11 text-placeholder">
        <span>{formatDate(first?.date)}</span>
        <span>
          {last.value} remaining on {formatDate(last.date)}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- States

export function LoadingPanel({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-13 text-tertiary">
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyPanel({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-13 text-placeholder",
        compact ? "py-4" : "py-10"
      )}
    >
      {!compact && <Inbox className="size-5" />}
      <span>{label}</span>
    </div>
  );
}

export function ErrorPanel({ label = "Something went wrong loading this." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-13 text-danger-primary">
      <AlertTriangle className="size-5" />
      <span>{label}</span>
    </div>
  );
}

/** The banner shown where a panel needs an Odoo route the bridge does not serve yet. */
export function BridgeMissingPanel({ what, reason }: { what: string; reason?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-subtle bg-layer-2 p-4 text-13 text-tertiary">
      <p className="font-medium text-secondary">{what} is not available yet</p>
      <p className="mt-1">
        {reason ??
          "This panel reads from Odoo. It switches on once the bridge serves the endpoints in odoo-implementation/ODOO_MODULE_SPEC.md."}
      </p>
    </div>
  );
}

// --------------------------------------------------------------- Pill labels

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-11 font-medium whitespace-nowrap",
        "bg-layer-3 text-secondary",
        className
      )}
    >
      {children}
    </span>
  );
}
