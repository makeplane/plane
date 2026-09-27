/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Per-user, per-workspace state for the Team Operations Dashboard.
 *
 * Identity is `(workspace_id, user_id)`: one viewer's scope/period/tab
 * choice never bleeds into another's view, and a workspace switch
 * resets the whole store. URL state always wins over the persisted
 * preference; the preference is the fallback. Preferences are persisted
 * to `localStorage` under a schema-versioned key (the same
 * forward-compatibility contract the v3 dashboard uses).
 *
 * The store is a plain observable with subscribe/getSnapshot for
 * `useSyncExternalStore`. It is intentionally NOT a MobX class: a key/
 * value bag with a subscribe callback is enough, and we avoid pulling a
 * one-off store into the app-wide MobX graph.
 *
 * `requestGeneration` and `scopeSignature` together drive stale-response
 * rejection. A late response whose `scopeSignature` no longer matches
 * the current snapshot is dropped (the per-scope fetches in
 * `dashboard-shell.tsx` compare both before committing state). This
 * matches the spec §20 promise: "response only renders for the same
 * scope that produced it".
 */

import type { TBusinessFilters, TDateBucket, TPeriodPreset, TSnapshotRule } from "@plane/types";

/** Bump when the persisted shape changes; older payloads are discarded. */
export const DASHBOARD_OPERATIONS_SCHEMA_VERSION = 1;

const STORAGE_KEY_PREFIX = "plane-dashboard-operations-preferences";

/** Allowed tabs on the dashboard route. */
export type TDashboardTab = "overview" | "projects" | "workload" | "timeline" | "insights";

export const DASHBOARD_TABS: TDashboardTab[] = ["overview", "projects", "workload", "timeline", "insights"];

export interface TDashboardOperationsPreferences {
  schema_version: number;
  /** "team" = whole workspace ACL scope; "my_work" = assignee=me. */
  view_mode: "team" | "my_work";
  period_preset: TPeriodPreset;
  date_bucket: TDateBucket;
  business_filters: TBusinessFilters;
  tab: TDashboardTab;
}

export const defaultDashboardOperationsPreferences = (): TDashboardOperationsPreferences => ({
  schema_version: DASHBOARD_OPERATIONS_SCHEMA_VERSION,
  view_mode: "team",
  period_preset: "this_month",
  date_bucket: "day",
  business_filters: {},
  tab: "overview",
});

/** Shape of the localStorage payload. */
export interface TDashboardOperationsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const dashboardOperationsStorageKey = (workspaceId: string, userId: string): string =>
  `${STORAGE_KEY_PREFIX}:${workspaceId}:${userId}`;

// ----- URL parameter contract ------------------------------------------

/** Tab → ?tab=  */
export const DASHBOARD_TAB_PARAM = "tab";
/** Scope mode → ?scope=team|my_work */
export const DASHBOARD_SCOPE_PARAM = "scope";
/** Period preset → ?period=this_month|last_30_days|last_7_days|none|custom */
export const DASHBOARD_PERIOD_PARAM = "period";
/** Custom period: ?start=ISO&end=ISO */
export const DASHBOARD_START_PARAM = "start";
export const DASHBOARD_END_PARAM = "end";
/** Date bucket → ?bucket=day|week|month */
export const DASHBOARD_BUCKET_PARAM = "bucket";
/** Drawer selection → ?drawer=overdue:page=N,size=N  */
export const DRAWER_SELECTION_PARAM = "drawer";
/** Business filters: comma-separated values keyed by business_filter field
 *  (?filter=state_id=uuid1,uuid2&filter=priority=urgent,high). One
 *  occurrence per key; multiple values per key are comma-joined. The
 *  set of keys must stay within the allowlist enforced by the backend. */
export const DASHBOARD_FILTER_PARAM = "filter";

const isString = (value: unknown): value is string => typeof value === "string";

export interface TDashboardUrlState {
  tab: TDashboardTab | null;
  view_mode: "team" | "my_work" | null;
  period_preset: TPeriodPreset | null;
  start: string | null;
  end: string | null;
  date_bucket: TDateBucket | null;
  business_filters: TBusinessFilters;
  drawer_selection: TDashboardDrawerSelection | null;
}

export interface TDashboardDrawerSelection {
  metric: TSnapshotRule | "attention";
  page: number;
  page_size: number;
}

const isPeriodPreset = (value: unknown): value is TPeriodPreset =>
  value === "this_month" ||
  value === "last_30_days" ||
  value === "last_7_days" ||
  value === "none" ||
  value === "custom";

const isDateBucket = (value: unknown): value is TDateBucket => value === "day" || value === "week" || value === "month";

const isViewMode = (value: unknown): value is "team" | "my_work" => value === "team" || value === "my_work";

const isTab = (value: unknown): value is TDashboardTab =>
  value === "overview" || value === "projects" || value === "workload" || value === "timeline" || value === "insights";

const ALLOWED_FILTER_KEYS = new Set<string>([
  "state_id",
  "state_group",
  "priority",
  "assignee_id",
  "label_id",
  "cycle_id",
  "module_id",
  "created_by",
  "work_item_type",
]);

/** Read a URL state snapshot from a `URLSearchParams`-like object. */
export function readDashboardUrlState(params: URLSearchParams): TDashboardUrlState {
  const tabRaw = params.get(DASHBOARD_TAB_PARAM);
  const scopeRaw = params.get(DASHBOARD_SCOPE_PARAM);
  const periodRaw = params.get(DASHBOARD_PERIOD_PARAM);
  const startRaw = params.get(DASHBOARD_START_PARAM);
  const endRaw = params.get(DASHBOARD_END_PARAM);
  const bucketRaw = params.get(DASHBOARD_BUCKET_PARAM);
  const drawerRaw = params.get(DRAWER_SELECTION_PARAM);

  // Filter parsing: ?filter=key=val1,val2 (repeatable).
  const business_filters: TBusinessFilters = {};
  for (const raw of params.getAll(DASHBOARD_FILTER_PARAM)) {
    const eq = raw.indexOf("=");
    if (eq <= 0) continue;
    const key = raw.slice(0, eq);
    if (!ALLOWED_FILTER_KEYS.has(key)) continue;
    const values = raw
      .slice(eq + 1)
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
    if (values.length > 0) business_filters[key as keyof TBusinessFilters] = values;
  }

  let drawer_selection: TDashboardDrawerSelection | null = null;
  if (drawerRaw) {
    // drawer=metric|attention[:page=N][:size=N]
    const segments = drawerRaw.split(":");
    const head = segments[0];
    if (head === "attention" || isSnapshotRule(head)) {
      drawer_selection = {
        metric: head === "attention" ? "attention" : (head as TSnapshotRule),
        page: 1,
        page_size: 25,
      };
      for (const seg of segments.slice(1)) {
        const [k, v] = seg.split("=");
        if (!isString(k) || !isString(v)) continue;
        if (k === "page") drawer_selection.page = Math.max(1, parseInt(v, 10) || 1);
        else if (k === "size") drawer_selection.page_size = Math.max(1, Math.min(100, parseInt(v, 10) || 25));
      }
    }
  }

  return {
    tab: isTab(tabRaw) ? tabRaw : null,
    view_mode: isViewMode(scopeRaw) ? scopeRaw : null,
    period_preset: isPeriodPreset(periodRaw) ? periodRaw : null,
    start: isString(startRaw) ? startRaw : null,
    end: isString(endRaw) ? endRaw : null,
    date_bucket: isDateBucket(bucketRaw) ? bucketRaw : null,
    business_filters,
    drawer_selection,
  };
}

const SNAPSHOT_RULES_SET: ReadonlySet<string> = new Set<string>([
  "total",
  "open",
  "not_started",
  "started",
  "completed",
  "cancelled",
  "overdue",
  "due_today",
  "due_soon",
  "blocked",
  "unassigned_urgent_high",
]);

function isSnapshotRule(value: string): value is TSnapshotRule {
  return SNAPSHOT_RULES_SET.has(value);
}

/** Serialize a URL state back into a `URLSearchParams`-like shape. */
export function writeDashboardUrlState(state: TDashboardUrlState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.tab) params.set(DASHBOARD_TAB_PARAM, state.tab);
  if (state.view_mode) params.set(DASHBOARD_SCOPE_PARAM, state.view_mode);
  if (state.period_preset) params.set(DASHBOARD_PERIOD_PARAM, state.period_preset);
  if (state.start) params.set(DASHBOARD_START_PARAM, state.start);
  if (state.end) params.set(DASHBOARD_END_PARAM, state.end);
  if (state.date_bucket) params.set(DASHBOARD_BUCKET_PARAM, state.date_bucket);
  if (state.drawer_selection) {
    const { metric, page, page_size } = state.drawer_selection;
    const head = metric === "attention" ? "attention" : metric;
    const tail = page === 1 && page_size === 25 ? "" : `:page=${page}:size=${page_size}`;
    params.set(DRAWER_SELECTION_PARAM, `${head}${tail}`);
  }
  for (const [key, values] of Object.entries(state.business_filters)) {
    if (!values || values.length === 0) continue;
    params.append(DASHBOARD_FILTER_PARAM, `${key}=${values.join(",")}`);
  }
  return params;
}

// ----- Scope signature (stale-response rejection) ----------------------

/**
 * Stable signature of the request scope. Two requests are equivalent
 * when every component is equal. The signature is part of the
 * `requestGeneration` counter that the shell uses to drop late
 * responses.
 *
 * The effective signature includes `view_mode === "my_work"` →
 * `assignee_id: [currentUserId]` injection so the resolver hash
 * matches what the wire payload actually carries (per spec §8
 * "My work" semantics; backend interprets `business_filters.assignee_id`
 * the same way regardless of view_mode).
 */
export interface TDashboardScopeSignature {
  view_mode: "team" | "my_work";
  period_preset: TPeriodPreset;
  start: string | null;
  end: string | null;
  date_bucket: TDateBucket;
  business_filters_key: string;
  project_ids_key: string;
}

export interface TBuildScopeSignatureArgs {
  prefs: TDashboardOperationsPreferences;
  projectIds: readonly string[];
  /** Custom half-open range; only used when period_preset === "custom". */
  customRange?: { start: string | null; end: string | null };
  /**
   * Current user id; injected into `business_filters.assignee_id`
   * when `view_mode === "my_work"` so the signature reflects the
   * actual wire payload.
   */
  currentUserId?: string | null;
}

export function buildScopeSignature(
  prefsOrArgs: TDashboardOperationsPreferences | TBuildScopeSignatureArgs,
  projectIds?: readonly string[],
  customRange?: { start: string | null; end: string | null },
  currentUserId?: string | null
): TDashboardScopeSignature {
  // Backward-compatible overload: callers may pass either a positional
  // pair `(prefs, projectIds)` (legacy) or an object (new). The
  // object form carries `customRange` and `currentUserId`, both of
  // which are required for the correct signature when the user has
  // either a custom range or "My work" view mode.
  let prefs: TDashboardOperationsPreferences;
  let ids: readonly string[];
  let range: { start: string | null; end: string | null } | undefined;
  let userId: string | null | undefined;
  if (
    projectIds === undefined &&
    typeof (prefsOrArgs as TBuildScopeSignatureArgs).prefs === "object" &&
    Array.isArray((prefsOrArgs as TBuildScopeSignatureArgs).projectIds)
  ) {
    const args = prefsOrArgs as TBuildScopeSignatureArgs;
    prefs = args.prefs;
    ids = args.projectIds;
    range = args.customRange;
    userId = args.currentUserId ?? null;
  } else {
    prefs = prefsOrArgs as TDashboardOperationsPreferences;
    ids = projectIds ?? [];
    range = customRange;
    userId = currentUserId ?? null;
  }

  const effectiveFilters = withAssigneeFilter(prefs.business_filters, prefs.view_mode, userId ?? null);
  return {
    view_mode: prefs.view_mode,
    period_preset: prefs.period_preset,
    start: prefs.period_preset === "custom" ? (range?.start ?? null) : null,
    end: prefs.period_preset === "custom" ? (range?.end ?? null) : null,
    date_bucket: prefs.date_bucket,
    business_filters_key: JSON.stringify(sortKeys(effectiveFilters)),
    project_ids_key: ids.slice().sort().join("|"),
  };
}

/**
 * Inject `assignee_id: [currentUserId]` when view mode is "my_work".
 *
 * Backend interprets `business_filters.assignee_id` the same way
 * regardless of `view_mode`, so a frontend switch from "team" to
 * "my work" must always translate to that filter (and a switch back
 * must remove it). When `currentUserId` is null AND view mode is
 * "my_work", the filter is omitted; the backend will see the
 * unassigned union.
 */
export function withAssigneeFilter(
  filters: TBusinessFilters,
  viewMode: "team" | "my_work",
  currentUserId: string | null
): TBusinessFilters {
  if (viewMode !== "my_work" || currentUserId === null) {
    if (viewMode === "team" && "assignee_id" in filters) {
      // "team" view must not silently narrow by the user's previous
      // "my work" assignee selection.
      const next = { ...filters };
      delete next.assignee_id;
      return next;
    }
    return filters;
  }
  return { ...filters, assignee_id: [currentUserId] };
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    // Sort primitive arrays so order doesn't change the signature.
    const items = value.map(sortKeys);
    const allPrimitive = items.every(
      (v) => v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean"
    );
    if (allPrimitive) return (items as unknown[]).slice().sort();
    return items;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value).sort()) out[k] = sortKeys((value as Record<string, unknown>)[k]);
    return out;
  }
  return value;
}

// ----- Store ------------------------------------------------------------

export interface IDashboardOperationsStore {
  getSnapshot(): TDashboardOperationsPreferences;
  getTab(): TDashboardTab;
  getViewMode(): "team" | "my_work";
  getPeriodPreset(): TPeriodPreset;
  getDateBucket(): TDateBucket;
  getBusinessFilters(): TBusinessFilters;
  getIdentity(): { workspaceId: string | null; userId: string | null };
  getCustomRange(): { start: string | null; end: string | null };
  /**
   * Stable snapshot for `useSyncExternalStore`. Cached so the same
   * object reference is returned until any of the four fields change.
   */
  getPeriodSnapshot(): { preset: TPeriodPreset; start: string | null; end: string | null; dateBucket: TDateBucket };
  getRequestGeneration(): number;
  getLastCommittedGeneration(): number;
  subscribe(listener: () => void): () => void;
  setIdentity(workspaceId: string | null, userId: string | null): void;
  setProjectIds(projectIds: readonly string[]): void;
  getProjectIds(): readonly string[];
  setViewMode(mode: "team" | "my_work"): void;
  setPeriodPreset(preset: TPeriodPreset): void;
  setCustomRange(start: string | null, end: string | null): void;
  setDateBucket(bucket: TDateBucket): void;
  setTab(tab: TDashboardTab): void;
  setBusinessFilters(filters: TBusinessFilters): void;
  addBusinessFilter(key: keyof TBusinessFilters, value: string): void;
  removeBusinessFilter(key: keyof TBusinessFilters, value?: string): void;
  /** Clear filters but keep period/tab. */
  clearFilters(): void;
  /** Reset to defaults (period too). */
  resetView(): void;
  applyUrlState(url: TDashboardUrlState): void;
  currentUrlState(): TDashboardUrlState;
  /** Record a request — returns the generation to use as a tag. */
  beginRequest(scopeSignature: TDashboardScopeSignature): number;
  /** Commit a successful response. Late generations return false. */
  commitResponse(generation: number, scopeSignature: TDashboardScopeSignature): boolean;
}

export class DashboardOperationsStore implements IDashboardOperationsStore {
  private workspaceId: string | null = null;
  private userId: string | null = null;
  private prefs: TDashboardOperationsPreferences = defaultDashboardOperationsPreferences();
  private projectIds: string[] = [];
  private customStart: string | null = null;
  private customEnd: string | null = null;
  private requestGeneration = 0;
  private lastCommittedGeneration = -1;
  private listeners = new Set<() => void>();
  private storage: TDashboardOperationsStorage;
  private boundEmit = (): void => this.emit();
  // Cached derived snapshot for useSyncExternalStore. Updated only when
  // one of the four fields actually changes; the same object reference
  // is returned until then.
  private cachedPeriodSnapshot: {
    preset: TPeriodPreset;
    start: string | null;
    end: string | null;
    dateBucket: TDateBucket;
  } | null = null;
  // Cached custom range object — `getCustomRange` MUST return a stable
  // reference for `useSyncExternalStore`, otherwise the hook detects a
  // new snapshot on every call and loops.
  private cachedCustomRange: { start: string | null; end: string | null } | null = null;

  constructor(storage: TDashboardOperationsStorage) {
    this.storage = storage;
  }

  // ---- identity ----

  setIdentity(workspaceId: string | null, userId: string | null): void {
    if (this.workspaceId === workspaceId && this.userId === userId) return;
    const switchedWorkspace = this.workspaceId !== null && this.workspaceId !== workspaceId;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.projectIds = [];
    this.customStart = null;
    this.customEnd = null;
    this.cachedCustomRange = null;
    if (workspaceId === null || userId === null) {
      this.prefs = defaultDashboardOperationsPreferences();
    } else if (switchedWorkspace) {
      // Spec §4 — workspace switch resets the whole store.
      this.prefs = defaultDashboardOperationsPreferences();
      this.persist();
    } else {
      this.prefs = this.load();
    }
    this.requestGeneration += 1;
    this.lastCommittedGeneration = -1;
    this.boundEmit();
  }

  getIdentity(): { workspaceId: string | null; userId: string | null } {
    return { workspaceId: this.workspaceId, userId: this.userId };
  }

  // ---- accessors ----

  getSnapshot(): TDashboardOperationsPreferences {
    return this.prefs;
  }
  getTab(): TDashboardTab {
    return this.prefs.tab;
  }
  getViewMode(): "team" | "my_work" {
    return this.prefs.view_mode;
  }
  getPeriodPreset(): TPeriodPreset {
    return this.prefs.period_preset;
  }
  getDateBucket(): TDateBucket {
    return this.prefs.date_bucket;
  }
  getBusinessFilters(): TBusinessFilters {
    return this.prefs.business_filters;
  }
  getCustomRange(): { start: string | null; end: string | null } {
    const cached = this.cachedCustomRange;
    if (cached !== null && cached.start === this.customStart && cached.end === this.customEnd) {
      return cached;
    }
    const next = { start: this.customStart, end: this.customEnd };
    this.cachedCustomRange = next;
    return next;
  }
  getPeriodSnapshot(): { preset: TPeriodPreset; start: string | null; end: string | null; dateBucket: TDateBucket } {
    const next = {
      preset: this.prefs.period_preset,
      start: this.customStart,
      end: this.customEnd,
      dateBucket: this.prefs.date_bucket,
    };
    const cached = this.cachedPeriodSnapshot;
    if (
      cached !== null &&
      cached.preset === next.preset &&
      cached.start === next.start &&
      cached.end === next.end &&
      cached.dateBucket === next.dateBucket
    ) {
      return cached;
    }
    this.cachedPeriodSnapshot = next;
    return next;
  }
  getRequestGeneration(): number {
    return this.requestGeneration;
  }
  getLastCommittedGeneration(): number {
    return this.lastCommittedGeneration;
  }
  getProjectIds(): readonly string[] {
    return this.projectIds;
  }

  // ---- mutations ----

  setProjectIds(projectIds: readonly string[]): void {
    if (projectIds.length === this.projectIds.length && projectIds.every((id, i) => id === this.projectIds[i])) {
      return;
    }
    this.projectIds = projectIds.slice();
    this.requestGeneration += 1;
    this.boundEmit();
  }

  setViewMode(mode: "team" | "my_work"): void {
    if (this.prefs.view_mode === mode) return;
    this.prefs = { ...this.prefs, view_mode: mode };
    this.persist();
    this.requestGeneration += 1;
    this.boundEmit();
  }

  setPeriodPreset(preset: TPeriodPreset): void {
    if (this.prefs.period_preset === preset) return;
    this.prefs = { ...this.prefs, period_preset: preset };
    if (preset !== "custom") {
      this.customStart = null;
      this.customEnd = null;
      this.cachedCustomRange = null;
    }
    this.persist();
    this.requestGeneration += 1;
    this.boundEmit();
  }

  setCustomRange(start: string | null, end: string | null): void {
    this.customStart = start;
    this.customEnd = end;
    this.cachedCustomRange = null;
    this.prefs = { ...this.prefs, period_preset: "custom" };
    this.persist();
    this.requestGeneration += 1;
    this.boundEmit();
  }

  setDateBucket(bucket: TDateBucket): void {
    if (this.prefs.date_bucket === bucket) return;
    this.prefs = { ...this.prefs, date_bucket: bucket };
    this.persist();
    this.requestGeneration += 1;
    this.boundEmit();
  }

  setTab(tab: TDashboardTab): void {
    if (this.prefs.tab === tab) return;
    this.prefs = { ...this.prefs, tab };
    this.persist();
    this.boundEmit();
  }

  setBusinessFilters(filters: TBusinessFilters): void {
    this.prefs = { ...this.prefs, business_filters: { ...filters } };
    this.persist();
    this.requestGeneration += 1;
    this.boundEmit();
  }

  addBusinessFilter(key: keyof TBusinessFilters, value: string): void {
    if (!ALLOWED_FILTER_KEYS.has(String(key))) return;
    const next: TBusinessFilters = { ...this.prefs.business_filters };
    const list = next[key] ? [...next[key]!] : [];
    if (!list.includes(value)) list.push(value);
    next[key] = list;
    this.prefs = { ...this.prefs, business_filters: next };
    this.persist();
    this.requestGeneration += 1;
    this.boundEmit();
  }

  removeBusinessFilter(key: keyof TBusinessFilters, value?: string): void {
    const next: TBusinessFilters = { ...this.prefs.business_filters };
    if (value === undefined) {
      delete next[key];
    } else {
      const list = (next[key] ?? []).filter((v) => v !== value);
      if (list.length === 0) delete next[key];
      else next[key] = list;
    }
    this.prefs = { ...this.prefs, business_filters: next };
    this.persist();
    this.requestGeneration += 1;
    this.boundEmit();
  }

  clearFilters(): void {
    if (Object.keys(this.prefs.business_filters).length === 0) return;
    this.prefs = { ...this.prefs, business_filters: {} };
    this.persist();
    this.requestGeneration += 1;
    this.boundEmit();
  }

  resetView(): void {
    this.prefs = defaultDashboardOperationsPreferences();
    this.customStart = null;
    this.customEnd = null;
    this.cachedCustomRange = null;
    this.projectIds = [];
    this.persist();
    this.requestGeneration += 1;
    this.lastCommittedGeneration = -1;
    this.boundEmit();
  }

  applyUrlState(url: TDashboardUrlState): void {
    let next: TDashboardOperationsPreferences = { ...this.prefs };
    let changed = false;
    if (url.tab && url.tab !== next.tab) {
      next = { ...next, tab: url.tab };
      changed = true;
    }
    if (url.view_mode && url.view_mode !== next.view_mode) {
      next = { ...next, view_mode: url.view_mode };
      changed = true;
    }
    if (url.period_preset && url.period_preset !== next.period_preset) {
      next = { ...next, period_preset: url.period_preset };
      changed = true;
    }
    if (url.date_bucket && url.date_bucket !== next.date_bucket) {
      next = { ...next, date_bucket: url.date_bucket };
      changed = true;
    }
    if (url.start !== null || url.end !== null) {
      this.customStart = url.start;
      this.customEnd = url.end;
      changed = true;
    }
    if (Object.keys(url.business_filters).length > 0) {
      next = { ...next, business_filters: { ...url.business_filters } };
      changed = true;
    }
    if (changed) {
      this.prefs = next;
      this.persist();
      this.requestGeneration += 1;
      this.boundEmit();
    }
  }

  currentUrlState(): TDashboardUrlState {
    return {
      tab: this.prefs.tab,
      view_mode: this.prefs.view_mode,
      period_preset: this.prefs.period_preset,
      start: this.customStart,
      end: this.customEnd,
      date_bucket: this.prefs.date_bucket,
      business_filters: this.prefs.business_filters,
      drawer_selection: null,
    };
  }

  // ---- request lifecycle ----

  beginRequest(_scopeSignature: TDashboardScopeSignature): number {
    this.requestGeneration += 1;
    this.boundEmit();
    return this.requestGeneration;
  }

  commitResponse(generation: number, _scopeSignature: TDashboardScopeSignature): boolean {
    // Stale-response rejection: only commit if this generation is the
    // current one. A newer beginRequest already bumped it.
    if (generation !== this.requestGeneration) return false;
    this.lastCommittedGeneration = generation;
    return true;
  }

  // ---- subscribe / persist ----

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ---- internal ----

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  private persist(): void {
    if (this.workspaceId === null || this.userId === null) return;
    const key = dashboardOperationsStorageKey(this.workspaceId, this.userId);
    try {
      this.storage.setItem(key, JSON.stringify(this.prefs));
    } catch {
      // localStorage may be unavailable (private mode, quota); the store
      // is in-memory and the user just loses persistence.
    }
  }

  private load(): TDashboardOperationsPreferences {
    if (this.workspaceId === null || this.userId === null) {
      return defaultDashboardOperationsPreferences();
    }
    const key = dashboardOperationsStorageKey(this.workspaceId, this.userId);
    let raw: string | null = null;
    try {
      raw = this.storage.getItem(key);
    } catch {
      return defaultDashboardOperationsPreferences();
    }
    if (!raw) return defaultDashboardOperationsPreferences();
    try {
      const parsed = JSON.parse(raw) as Partial<TDashboardOperationsPreferences>;
      if (parsed && typeof parsed === "object" && parsed.schema_version === DASHBOARD_OPERATIONS_SCHEMA_VERSION) {
        return sanitizeDashboardOperationsPreferences(parsed);
      }
    } catch {
      // discard corrupted payload
    }
    return defaultDashboardOperationsPreferences();
  }
}

function sanitizeDashboardOperationsPreferences(
  raw: Partial<TDashboardOperationsPreferences>
): TDashboardOperationsPreferences {
  const fallback = defaultDashboardOperationsPreferences();
  const view_mode = raw.view_mode === "my_work" ? "my_work" : "team";
  const period_preset: TPeriodPreset = isPeriodPreset(raw.period_preset) ? raw.period_preset : fallback.period_preset;
  const date_bucket: TDateBucket = isDateBucket(raw.date_bucket) ? raw.date_bucket : fallback.date_bucket;
  const tab: TDashboardTab = isTab(raw.tab) ? raw.tab : fallback.tab;
  const business_filters: TBusinessFilters = {};
  if (raw.business_filters && typeof raw.business_filters === "object") {
    for (const [key, value] of Object.entries(raw.business_filters)) {
      if (!ALLOWED_FILTER_KEYS.has(key)) continue;
      if (!Array.isArray(value)) continue;
      const filtered = value.filter((v): v is string => typeof v === "string" && v.length > 0);
      if (filtered.length > 0) business_filters[key as keyof TBusinessFilters] = filtered;
    }
  }
  return {
    schema_version: DASHBOARD_OPERATIONS_SCHEMA_VERSION,
    view_mode,
    period_preset,
    date_bucket,
    business_filters,
    tab,
  };
}
