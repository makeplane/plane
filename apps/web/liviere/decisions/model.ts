/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: logic of the decision register page without React: filters, grouping, tree counts,
// version chains, map edges, view state in the URL and review dates. Tested by model.test.mjs under
// `node --test`, which strips the types itself: keep this file free of runtime imports (`import type` only).

import type { TDecision, TDecisionArea, TDecisionKind, TDecisionQueue, TDecisionStatus } from "./types";

// ---------------------------------------------------------------------------------------------------------
// View state (URL parameters)

export const DECISION_VIEWS = ["areas", "map"] as const;
export type TDecisionView = (typeof DECISION_VIEWS)[number];

// "current" = active, "past" = superseded and revoked
export const STATUS_FILTERS = ["current", "proposed", "deferred", "done", "past", "all"] as const;
export type TStatusFilter = (typeof STATUS_FILTERS)[number];

const KINDS: readonly string[] = ["product", "architecture", "process", "operations"];
const QUEUES: readonly string[] = ["confirm", "review", "rollout", "proposed", "imported"];

export type TDecisionViewState = {
  view: TDecisionView;
  area: string | null;
  mech: string | null;
  queue: TDecisionQueue | null;
  status: TStatusFilter;
  kind: TDecisionKind | "all";
  // The opened decision (expanded card, or the side panel of the map)
  d: number | null;
};

export const DEFAULT_VIEW_STATE: TDecisionViewState = {
  view: "areas",
  area: null,
  mech: null,
  queue: null,
  status: "current",
  kind: "all",
  d: null,
};

export const VIEW_STATE_PARAMS = ["view", "area", "mech", "queue", "status", "kind", "d"] as const;

// Area and mechanism keys are slugs (apps/api/plane/liviere/decisions/rules.py)
const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/;

const pick = <T extends string>(value: string | null, allowed: readonly string[], fallback: T): T =>
  value !== null && allowed.includes(value) ? (value as T) : fallback;
const slug = (value: string | null) => (value !== null && KEY_PATTERN.test(value) ? value : null);

/** A sorted copy (the lib target has no Array#toSorted). */
function sorted<T>(items: readonly T[], compare: (a: T, b: T) => number): T[] {
  const copy = [...items];
  copy.sort(compare);
  return copy;
}

/** Reads the view state from URL parameters; unknown values fall back to the defaults. */
export function parseViewState(get: (name: string) => string | null): TDecisionViewState {
  const area = slug(get("area"));
  const number = Number(get("d"));
  return {
    view: pick(get("view"), DECISION_VIEWS, DEFAULT_VIEW_STATE.view),
    area,
    // A mechanism only means something under its area
    mech: area ? slug(get("mech")) : null,
    queue: pick<TDecisionQueue | "">(get("queue"), QUEUES, "") || null,
    status: pick(get("status"), STATUS_FILTERS, DEFAULT_VIEW_STATE.status),
    kind: pick<TDecisionKind | "all">(get("kind"), KINDS, "all"),
    d: Number.isInteger(number) && number > 0 ? number : null,
  };
}

/** The URL change for a view state: non-default values to set, default ones to remove. */
export function viewStateParams(state: TDecisionViewState): { add: Record<string, string>; remove: string[] } {
  const add: Record<string, string> = {};
  const remove: string[] = [];
  const put = (name: string, value: string | null, fallback: string | null) => {
    if (value === null || value === fallback) remove.push(name);
    else add[name] = value;
  };
  put("view", state.view, DEFAULT_VIEW_STATE.view);
  put("area", state.area, null);
  put("mech", state.area ? state.mech : null, null);
  put("queue", state.queue, null);
  put("status", state.status, DEFAULT_VIEW_STATE.status);
  put("kind", state.kind, "all");
  put("d", state.d === null ? null : String(state.d), null);
  return { add, remove };
}

// ---------------------------------------------------------------------------------------------------------
// Filters

const PAST: ReadonlySet<TDecisionStatus> = new Set(["superseded", "revoked"]);

export function statusMatches(status: TDecisionStatus, filter: TStatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "current") return status === "active";
  if (filter === "past") return PAST.has(status);
  return status === filter;
}

export const isPast = (decision: TDecision) =>
  decision.status === "superseded" || decision.status === "revoked" || decision.status === "done";

export const inArea = (decision: TDecision, area: string) => decision.area === area || decision.area2 === area;

/**
 * The decision number a search phrase names: `12`, `D12`, `DEMO-D12`; null if it names none. `DEMO-12` is
 * a work item, not a decision.
 */
export function parseDecisionNumber(phrase: string): number | null {
  const match = /^(?:[a-z][a-z0-9]*-d|d)?(\d{1,6})$/i.exec(phrase.trim());
  if (!match) return null;
  const number = Number(match[1]);
  return number > 0 ? number : null;
}

/** Shortest phrase the search endpoint takes (POST search/, 3–200 characters). */
export const SEARCH_MIN_LENGTH = 3;
export const SEARCH_MAX_LENGTH = 200;

/**
 * Numbers a phrase finds besides the full-text search of the API, which covers only the title, rationale,
 * rejected and note: the decision it names by number and those linked to the work item it names.
 */
export function localSearchHits(decisions: TDecision[], phrase: string): Set<number> {
  const hits = new Set<number>();
  const trimmed = phrase.trim();
  if (!trimmed) return hits;
  const number = parseDecisionNumber(trimmed);
  const upper = trimmed.toUpperCase();
  for (const decision of decisions) {
    if (number !== null && decision.number === number) hits.add(decision.number);
    else if (decision.identifier.toUpperCase() === upper) hits.add(decision.number);
    else if (decision.issues.some((issue) => issue.identifier.toUpperCase() === upper)) hits.add(decision.number);
  }
  return hits;
}

export type TDecisionFilter = {
  status: TStatusFilter;
  kind: TDecisionKind | "all";
  queue: TDecisionQueue | null;
  // null: no search; otherwise the numbers the phrase found
  hits: Set<number> | null;
};

/** Filters before the area: a queue replaces the status filter, as on the server. */
export function baseMatches(decision: TDecision, filter: TDecisionFilter): boolean {
  if (filter.queue ? !decision.queues.includes(filter.queue) : !statusMatches(decision.status, filter.status))
    return false;
  if (filter.kind !== "all" && decision.kind !== filter.kind) return false;
  return filter.hits === null || filter.hits.has(decision.number);
}

export function areaMatches(decision: TDecision, area: string | null, mech: string | null): boolean {
  if (!area) return true;
  if (mech) return decision.area === area && decision.mechanism === mech;
  return inArea(decision, area);
}

/** Search hits the status filter hides (kind still applies): "N more results in other states". */
export function hiddenByStatus(decisions: TDecision[], filter: TDecisionFilter): number {
  if (filter.hits === null || filter.queue || filter.status === "all") return 0;
  return decisions.filter(
    (decision) =>
      filter.hits!.has(decision.number) &&
      !statusMatches(decision.status, filter.status) &&
      (filter.kind === "all" || decision.kind === filter.kind)
  ).length;
}

// ---------------------------------------------------------------------------------------------------------
// Area tree and groups

export type TTreeCounts = { total: number; areas: Map<string, number>; mechanisms: Map<string, number> };

export const mechanismKey = (area: string, mechanism: string) => `${area}/${mechanism}`;

const bump = (map: Map<string, number>, name: string) => map.set(name, (map.get(name) ?? 0) + 1);

/** Counts per area (a second area counts too) and per mechanism, of the decisions passing the filters. */
export function treeCounts(decisions: TDecision[]): TTreeCounts {
  const areas = new Map<string, number>();
  const mechanisms = new Map<string, number>();
  for (const decision of decisions) {
    bump(areas, decision.area);
    if (decision.area2 && decision.area2 !== decision.area) bump(areas, decision.area2);
    if (decision.mechanism) bump(mechanisms, mechanismKey(decision.area, decision.mechanism));
  }
  return { total: decisions.length, areas, mechanisms };
}

export type TDecisionGroup =
  | { type: "area"; key: string; area: string; items: TDecision[] }
  | { type: "mechanism"; key: string; mechanism: string | null; items: TDecision[] }
  | { type: "secondary"; key: string; area: string; items: TDecision[] };

/** Newest decision date first, then the higher number; decisions without a date last. */
export function compareDecisions(a: TDecision, b: TDecision): number {
  if (a.decided_on !== b.decided_on) {
    if (!a.decided_on) return 1;
    if (!b.decided_on) return -1;
    return b.decided_on.localeCompare(a.decided_on);
  }
  return b.number - a.number;
}

/**
 * Groups of the list. Without an area: one group per area, in the order of the area tree. With an area:
 * decisions without a mechanism ("general"), then one group per mechanism, then those having the area as
 * their second one, grouped by their own area.
 */
export function groupDecisions(decisions: TDecision[], areas: TDecisionArea[], area: string | null): TDecisionGroup[] {
  const ordered = sorted(decisions, compareDecisions);
  const areaOrder = new Map(areas.map((item, index) => [item.key, index]));
  const position = (key: string) => areaOrder.get(key) ?? Number.MAX_SAFE_INTEGER;
  if (!area) {
    const groups = new Map<string, TDecision[]>();
    for (const decision of ordered) groups.set(decision.area, [...(groups.get(decision.area) ?? []), decision]);
    return sorted([...groups.entries()], ([a], [b]) => position(a) - position(b) || a.localeCompare(b)).map(
      ([key, items]) => ({ type: "area", key: `area:${key}`, area: key, items })
    );
  }
  const own = ordered.filter((decision) => decision.area === area);
  const mechanisms = areas.find((item) => item.key === area)?.mechanisms ?? [];
  const mechanismOrder = new Map(mechanisms.map((item, index) => [item.key, index]));
  const byMechanism = new Map<string | null, TDecision[]>();
  for (const decision of own) {
    const key = decision.mechanism;
    byMechanism.set(key, [...(byMechanism.get(key) ?? []), decision]);
  }
  const result: TDecisionGroup[] = sorted([...byMechanism.entries()], ([a], [b]) => {
    if (a === null) return -1;
    if (b === null) return 1;
    return (mechanismOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (mechanismOrder.get(b) ?? Number.MAX_SAFE_INTEGER);
  }).map(([mechanism, items]) => ({ type: "mechanism", key: `mechanism:${mechanism ?? ""}`, mechanism, items }));
  const secondary = new Map<string, TDecision[]>();
  for (const decision of ordered)
    if (decision.area !== area && decision.area2 === area)
      secondary.set(decision.area, [...(secondary.get(decision.area) ?? []), decision]);
  for (const [name, items] of sorted([...secondary.entries()], ([a], [b]) => position(a) - position(b)))
    result.push({ type: "secondary", key: `secondary:${name}`, area: name, items });
  return result;
}

// ---------------------------------------------------------------------------------------------------------
// Version chain

export type TVersionChain = {
  // Oldest first, up to the direct predecessor
  previous: TDecision[];
  // Every successor (also after a split), by generation, then by number
  next: TDecision[][];
  // Decisions made by the same split as this one (same predecessor)
  siblings: TDecision[];
};

/** The versions of a decision from the full list: what it replaced and what replaced it. Safe on cycles. */
export function versionChain(byNumber: Map<number, TDecision>, number: number): TVersionChain {
  const decision = byNumber.get(number);
  const empty: TVersionChain = { previous: [], next: [], siblings: [] };
  if (!decision) return empty;
  const seen = new Set<number>([number]);
  const previous: TDecision[] = [];
  let cursor = decision;
  while (cursor.supersedes !== null && byNumber.has(cursor.supersedes) && !seen.has(cursor.supersedes)) {
    seen.add(cursor.supersedes);
    cursor = byNumber.get(cursor.supersedes)!;
    previous.unshift(cursor);
  }
  const successorsOf = (item: TDecision) =>
    sorted(
      item.superseded_by.filter((successor) => byNumber.has(successor) && !seen.has(successor)),
      (a, b) => a - b
    ).map((successor) => byNumber.get(successor)!);
  const next: TDecision[][] = [];
  let generation = successorsOf(decision);
  while (generation.length) {
    for (const item of generation) seen.add(item.number);
    next.push(generation);
    generation = generation.flatMap(successorsOf);
  }
  const predecessor = decision.supersedes !== null ? byNumber.get(decision.supersedes) : undefined;
  const siblings = predecessor
    ? sorted(
        predecessor.superseded_by.filter((sibling) => sibling !== number && byNumber.has(sibling)),
        (a, b) => a - b
      ).map((sibling) => byNumber.get(sibling)!)
    : [];
  return { previous, next, siblings };
}

// ---------------------------------------------------------------------------------------------------------
// Review and return dates

const utcDay = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

/** Days from one YYYY-MM-DD date to another (negative: the second is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((utcDay(to) - utcDay(from)) / 86_400_000);
}

// Like the "review" queue on the server: a review date within 14 days, also a past one
export const REVIEW_SOON_DAYS = 14;

export type TReviewBadge = {
  // "review" for an active decision, "return" for a deferred one
  type: "review" | "return";
  date: string | null;
  condition: string | null;
  estimated: boolean;
  overdue: boolean;
  soon: boolean;
};

/** The review (active) or return (deferred) date and condition of a decision, relative to today. */
export function reviewBadge(decision: TDecision, today: string | null): TReviewBadge | null {
  if (decision.status !== "active" && decision.status !== "deferred") return null;
  if (!decision.review_on && !decision.review_condition) return null;
  const days = decision.review_on && today ? daysBetween(today, decision.review_on) : null;
  return {
    type: decision.status === "deferred" ? "return" : "review",
    date: decision.review_on,
    condition: decision.review_condition,
    estimated: decision.estimated.includes("review_on"),
    overdue: days !== null && days < 0,
    soon: days !== null && days <= REVIEW_SOON_DAYS,
  };
}

/** A YYYY-MM-DD date some days after another (for suggested dates in the forms). */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** DD.MM.YYYY of a YYYY-MM-DD date, without time zone shifts. */
export function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

// ---------------------------------------------------------------------------------------------------------
// Text

// start: offset in the source text (a stable key)
export type TTextPart = { code: boolean; text: string; start: number };

/** Splits `code` spans out of plain text; the page renders them as <code>, everything else as text. */
export function splitCode(text: string): TTextPart[] {
  const parts: TTextPart[] = [];
  const pattern = /`([^`]+)`/g;
  let last = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    if (match.index > last) parts.push({ code: false, text: text.slice(last, match.index), start: last });
    parts.push({ code: true, text: match[1], start: match.index });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ code: false, text: text.slice(last), start: last });
  return parts;
}

// ---------------------------------------------------------------------------------------------------------
// Map edges

export type TMapEdge = { from: number; to: number; type: "supersedes" | "related" };

/** Lines of the map: old → successor for every replacement (several after a split), each related pair once. */
export function mapEdges(decisions: TDecision[]): TMapEdge[] {
  const numbers = new Set(decisions.map((decision) => decision.number));
  const edges: TMapEdge[] = [];
  const pairs = new Set<string>();
  for (const decision of decisions) {
    if (decision.supersedes !== null && numbers.has(decision.supersedes))
      edges.push({ from: decision.supersedes, to: decision.number, type: "supersedes" });
    for (const other of decision.related) {
      if (other === decision.number || !numbers.has(other)) continue;
      const low = Math.min(decision.number, other);
      const high = Math.max(decision.number, other);
      const key = `${low}-${high}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      edges.push({ from: low, to: high, type: "related" });
    }
  }
  return edges;
}
