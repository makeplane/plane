/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { sortBy } from "lodash-es";
import type { TBoardProduct, TProductIndicator, TStateGroups } from "@plane/types";

export const STATE_GROUPS: TStateGroups[] = ["backlog", "unstarted", "started", "completed", "cancelled"];

export const INDICATORS: TProductIndicator[] = [
  "overdue",
  "at_risk",
  "on_track",
  "not_started",
  "completed",
  "cancelled",
];

export const INDICATOR_COLORS: Record<TProductIndicator, string> = {
  completed: "bg-success-primary",
  cancelled: "bg-(--text-color-placeholder)",
  overdue: "bg-danger-primary",
  at_risk: "bg-warning-primary",
  not_started: "bg-(--text-color-tertiary)",
  on_track: "bg-accent-primary",
};

/** Filters as the address of the page keeps them. */
export const LIST_FILTERS = ["team", "portfolio", "project", "type", "status", "indicator", "owner"] as const;
export type TListFilter = (typeof LIST_FILTERS)[number];
export type TBoardFilters = Record<TListFilter, string[]> & { from: string; to: string };

const valueOf = (product: TBoardProduct, filter: TListFilter): string | null => {
  switch (filter) {
    case "team":
      return product.team_id;
    case "portfolio":
      return product.portfolio_id;
    case "project":
      return product.project_id;
    case "type":
      return product.product_type_id;
    case "status":
      return product.state_group;
    case "indicator":
      return product.indicator;
    case "owner":
      return product.owner_id;
  }
};

export const matches = (product: TBoardProduct, filters: TBoardFilters): boolean =>
  LIST_FILTERS.every((filter) => {
    if (!filters[filter].length) return true;
    const value = valueOf(product, filter);
    return value !== null && filters[filter].includes(value);
  }) &&
  // the period and the dates of the product overlap
  (!filters.from || !product.target_date || product.target_date >= filters.from) &&
  (!filters.to || !product.start_date || product.start_date <= filters.to);

export const summarize = (products: Pick<TBoardProduct, "state_group" | "indicator">[]) => ({
  total: products.length,
  in_progress: products.filter((product) => product.state_group === "started").length,
  at_risk: products.filter((product) => product.indicator === "at_risk").length,
  overdue: products.filter((product) => product.indicator === "overdue").length,
});

export type TGrouping = "team" | "portfolio" | "project";

export const groupBy = <T>(items: T[], key: (item: T) => string): Map<string, T[]> => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const id = key(item);
    groups.set(id, [...(groups.get(id) ?? []), item]);
  }
  return groups;
};

const DAY = 86_400_000;
const toDays = (date: string): number => Math.round(Date.parse(`${date}T00:00:00Z`) / DAY);
const fromDays = (days: number): string => new Date(days * DAY).toISOString().slice(0, 10);

export const addDays = (date: string, days: number): string => fromDays(toDays(date) + days);
export const daysBetween = (from: string, to: string): number => toDays(to) - toDays(from);

export type TScale = "week" | "month" | "quarter";
export const SCALES: TScale[] = ["week", "month", "quarter"];
export const DAY_WIDTH: Record<TScale, number> = { week: 28, month: 8, quarter: 3 };

/** First days of the weeks, months or quarters in a period. */
export const getTicks = (from: string, to: string, scale: TScale): string[] => {
  const ticks: string[] = [];
  const first = new Date(`${from}T00:00:00Z`);
  if (scale === "week") first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7));
  else {
    first.setUTCDate(1);
    if (scale === "quarter") first.setUTCMonth(first.getUTCMonth() - (first.getUTCMonth() % 3));
  }
  for (const tick = first; tick.toISOString().slice(0, 10) <= to; ) {
    ticks.push(tick.toISOString().slice(0, 10));
    if (scale === "week") tick.setUTCDate(tick.getUTCDate() + 7);
    else tick.setUTCMonth(tick.getUTCMonth() + (scale === "month" ? 1 : 3));
  }
  return ticks;
};

export type TTimelineItem = {
  id: string;
  name: string;
  start_date: string | null;
  target_date: string | null;
  progress: number | null;
  indicator: TProductIndicator;
};

/** The dates of the items and today, with room on both sides. */
export const getPeriod = (items: TTimelineItem[], today: string): { from: string; to: string } => {
  const dates = items.flatMap((item) => [item.start_date, item.target_date]).filter((date) => date !== null);
  const sorted = sortBy([...dates, today]);
  return { from: addDays(sorted[0], -14), to: addDays(sorted[sorted.length - 1], 30) };
};

/** New dates after an edge moved, never past the other edge. */
export const moveEdge = (
  item: Pick<TTimelineItem, "start_date" | "target_date">,
  edge: "start_date" | "target_date",
  days: number
): string | null => {
  const date = item[edge];
  if (!date) return null;
  const moved = addDays(date, days);
  const other = edge === "start_date" ? item.target_date : item.start_date;
  if (!other) return moved;
  return edge === "start_date" ? (moved > other ? other : moved) : moved < other ? other : moved;
};
