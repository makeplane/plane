/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { runInAction } from "mobx";
import { clone } from "lodash-es";
// plane imports
import type { TIssue } from "@plane/types";
// services
import { IssueService } from "@/services/issue/issue.service";
import { InboxIssueService } from "@/services/inbox";
// local imports
import type { TLiveEvent, TLiveItem } from "./client";
import type { IProjectIssues } from "@/store/issue/project";
import type { ICycleIssues } from "@/store/issue/cycle";
import type { IModuleIssues } from "@/store/issue/module";
import type { IProjectViewIssues } from "@/store/issue/project-views";
import type { IArchivedIssues } from "@/store/issue/archived";
import type { IProjectInboxStore } from "@/store/inbox/project-inbox.store";
import type { IWorkspaceIssues } from "@/store/issue/workspace";
import type { IIssueDetail } from "@/store/issue/issue-details/root.store";
import type { IIssueStore } from "@/store/issue/issue.store";
import { EIssueGroupedAction } from "@/store/issue/helpers/base-issues.store";
import type { IBaseIssuesStore } from "@/store/issue/helpers/base-issues.store";
// the user's own in-flight edits win over live reads that started before them
import { localEdits } from "@/lib/live-events/local-edits";
// filtered lists and saved views evaluate their filter on the fetched work item
import { compileFilter } from "./filter-match";
import type { TFilterMatcher } from "./filter-match";

export const APPLY_DEBOUNCE_MS = 300;
export const APPLY_DEBOUNCE_MAX_MS = 1000;
export const COARSE_DEBOUNCE_MS = 1000;
export const CHUNK_SIZE = 50;
export const PEEK_FETCH_THROTTLE_MS = 2000;
export const OWN_ACTOR_DELAY_MS = 1500;
/** a full refresh that found the user's edits in flight (or got a stale answer) retries */
export const COARSE_RETRY_MS = 1500;
/** a per-item fetch of a work item the user edited meanwhile is retried after this */
export const LOCAL_EDIT_RETRY_MS = 1500;

// ---------------------------------------------------------------------------
// pure decision logic
// ---------------------------------------------------------------------------

export type TListScope =
  | { kind: "project" }
  | { kind: "cycle"; cycleId: string }
  | { kind: "module"; moduleId: string };
export type TStoreAction = "add" | "update" | "remove" | "none";

/** True when the issue belongs in the list a store represents. */
export const isIssueInScope = (
  scope: TListScope,
  projectId: string,
  issue: Pick<TIssue, "project_id" | "cycle_id" | "module_ids">
): boolean => {
  if (issue.project_id !== projectId) return false;
  switch (scope.kind) {
    case "project":
      return true;
    case "cycle":
      return issue.cycle_id === scope.cycleId;
    case "module":
      return (issue.module_ids ?? []).includes(scope.moduleId);
  }
};

/**
 * What a list store has to do with a fetched issue.
 * - in scope and not listed yet: add (local-create semantics, bumps counts)
 * - in scope and listed: update (regroup / resort from the before state)
 * - out of scope and listed: remove
 * with `matches` (the list's filter), "in scope" also requires the work item to match it.
 */
export const decideStoreAction = (params: {
  scope: TListScope;
  projectId: string;
  issue: TIssue;
  inList: boolean;
  matches?: TFilterMatcher;
}): TStoreAction => {
  const inScope =
    isIssueInScope(params.scope, params.projectId, params.issue) && (!params.matches || params.matches(params.issue));
  if (inScope) return params.inList ? "update" : "add";
  return params.inList ? "remove" : "none";
};

/** Walks a (sub)grouped id structure and reports whether the id is listed anywhere. */
export const listContainsIssue = (grouped: unknown, issueId: string): boolean => {
  if (Array.isArray(grouped)) return grouped.includes(issueId);
  if (typeof grouped !== "object" || grouped === null) return false;
  return Object.values(grouped).some((value) => listContainsIssue(value, issueId));
};

/** every work item id in a (sub)grouped id structure. */
export const listedIssueIds = (grouped: unknown, into: Set<string> = new Set()): Set<string> => {
  if (Array.isArray(grouped)) grouped.forEach((id) => typeof id === "string" && into.add(id));
  else if (typeof grouped === "object" && grouped !== null)
    Object.values(grouped).forEach((value) => listedIssueIds(value, into));
  return into;
};

/** a metadata refresh for unknown label or state ids waits this long, merged across a burst */
export const UNKNOWN_METADATA_DEBOUNCE_MS = 500;

/** A store is "filtered" when its filter expression is not empty. Filtered lists take the coarse path. */
export const isFilterExpressionActive = (richFilters: unknown): boolean =>
  typeof richFilters === "object" && richFilters !== null && Object.keys(richFilters).length > 0;

export const chunkIds = (ids: string[], size: number = CHUNK_SIZE): string[][] => {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) chunks.push(ids.slice(i, i + size));
  return chunks;
};

export const changeKey = (kind: string, verb: string) => `${kind}:${verb}`;

/**
 * kinds x verbs of one hub item, as the keys the applier accumulates per issue.
 * The hub aggregates kinds and verbs of an item as two separate sets, so the pairing is lost. When both
 * sets have several entries a pair may not have happened (a comment deleted while the issue was edited),
 * so `issue:deleted` is left out; a missed delete is then caught by the not-found path of fetchIssue.
 */
export const itemChangeKeys = (item: Pick<TLiveItem, "kinds" | "verbs">): string[] => {
  const kinds = item.kinds.length > 0 ? item.kinds : ["issue"];
  const verbs = item.verbs.length > 0 ? item.verbs : ["updated"];
  const ambiguous = kinds.length > 1 && verbs.length > 1;
  const keys = kinds.flatMap((kind) => verbs.map((verb) => changeKey(kind, verb)));
  return ambiguous ? keys.filter((key) => key !== changeKey("issue", "deleted")) : keys;
};

/** True when every actor of the item is the current user (an item without actors is never "own"). */
export const isOwnItem = (item: Pick<TLiveItem, "actor_ids">, currentUserId: string | undefined): boolean =>
  !!currentUserId && item.actor_ids.length > 0 && item.actor_ids.every((id) => id === currentUserId);

const isCommentKey = (key: string) => key.startsWith("comment:") || key.startsWith("comment_reaction:");

/** A comment was updated, deleted or reacted to: the cached comment list of the issue is stale. */
export const shouldResetComments = (keys: Iterable<string>): boolean => {
  for (const key of keys) if (isCommentKey(key) && key !== changeKey("comment", "created")) return true;
  return false;
};

/** The batch carries an issue delete for the id: the only case where the issue map entry may be dropped. */
export const hasIssueDeleted = (keys: Iterable<string>): boolean => {
  for (const key of keys) if (key === changeKey("issue", "deleted")) return true;
  return false;
};

/**
 * Best effort: the service rethrows only the response body, so the status is usually missing.
 * Matches the API body of a missing work item ({ error: "The required object does not exist." }),
 * a DRF style { detail: "Not found." }, and the Error thrown by the store ("Work item not found").
 */
export const isNotFoundError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) return false;
  const body = error as {
    status?: unknown;
    status_code?: unknown;
    error?: unknown;
    detail?: unknown;
    message?: unknown;
  };
  if (body.status === 404 || body.status_code === 404) return true;
  return [body.error, body.detail, body.message].some(
    (text) => typeof text === "string" && /does not exist|not found/i.test(text)
  );
};

/** Any comment change at all. */
export const hasCommentChange = (keys: Iterable<string>): boolean => {
  for (const key of keys) if (isCommentKey(key)) return true;
  return false;
};

// ---------------------------------------------------------------------------
// applier
// ---------------------------------------------------------------------------

/**
 * `archived` is the archived work items route (projects/<id>/archives/issues).
 * `intake` is the intake (triage) route (projects/<id>/intake).
 */
export type TLiveRoute = {
  cycleId?: string;
  moduleId?: string;
  viewId?: string;
  archived?: boolean;
  intake?: boolean;
  /** the intake item open in the intake detail pane (the inboxIssueId query parameter) */
  intakeIssueId?: string;
  /** a workspace view (all-issues, assigned, created, subscribed, or a saved workspace view id) */
  globalViewId?: string;
};

/** an intake list refresh (new intake items, full refreshes) waits this long, merged across a burst */
export const INTAKE_LIST_DEBOUNCE_MS = 1000;

const isIntakeKey = (key: string) => key.startsWith("intake:");

export interface ILiveApplierDeps {
  workspaceSlug: string;
  projectId: string;
  getRoute: () => TLiveRoute;
  getCurrentUserId: () => string | undefined;
  issueMap: IIssueStore;
  projectIssues: IProjectIssues;
  cycleIssues: ICycleIssues;
  moduleIssues: IModuleIssues;
  viewIssues: IProjectViewIssues;
  archivedIssues: IArchivedIssues;
  /** the intake (triage) list */
  projectInbox: IProjectInboxStore;
  /** the group of a state, for state_group filters */
  getStateGroup: (stateId: string) => string | undefined;
  /**
   * whether the project's label and state stores know an id. A work item that carries an unknown one
   * (a label or state created through a path that publishes no metadata event) would
   * render it as nothing until a reload; the applier then refreshes the project's metadata once.
   */
  isKnownLabel?: (labelId: string) => boolean;
  isKnownState?: (stateId: string) => boolean;
  /** the same for estimate points */
  isKnownEstimatePoint?: (pointId: string) => boolean;
  /**
   * the workspace view list (one applier per project of the view feeds it) and its refetch, which
   * the workspace hook shares between those appliers so a burst over several projects costs one request
   */
  workspace?: {
    issues: IWorkspaceIssues;
    refetch: () => Promise<unknown>;
    /** the view's stored rich filter */
    getRichFilters: () => unknown;
  };
  getFilterExpression: (store: "project" | "cycle" | "module" | "view") => unknown;
  issueDetail: IIssueDetail;
  onIssueMissingFromPeek: () => void;
  /** the work item shown by the full-page detail route (browse/[workItem]), if that route is open */
  getPageIssueId?: () => string | undefined;
  /** Refetches the project's state, label, cycle and module definitions (metadata events and full refreshes). */
  refreshProjectMetadata: () => Promise<unknown>;
}

type TListTarget = {
  store: IBaseIssuesStore;
  scope: TListScope;
  coarse: boolean;
  /** the list's filter, evaluated on each fetched work item (absent for an unfiltered list) */
  matches?: TFilterMatcher;
  refetch: () => Promise<unknown>;
};

/**
 * how a list with this filter takes live changes. Unfiltered: per work item. Filtered with a filter
 * the client can evaluate: per work item, adding or removing it by the filter. Otherwise: a full refetch.
 */
const filterMode = (
  richFilters: unknown,
  getStateGroup: (stateId: string) => string | undefined
): { coarse: boolean; matches?: TFilterMatcher } => {
  if (!isFilterExpressionActive(richFilters)) return { coarse: false };
  const matches = compileFilter(richFilters, getStateGroup);
  return matches ? { coarse: false, matches } : { coarse: true };
};

export class LiveWorkItemsApplier {
  private issueService = new IssueService();
  private inboxIssueService = new InboxIssueService();
  private intakeListTimer: ReturnType<typeof setTimeout> | undefined;
  private pending = new Map<string, Set<string>>();
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private debounceStartedAt = 0;
  private coarseTimer: ReturnType<typeof setTimeout> | undefined;
  private coarseAll = false;
  private ownActorTimers = new Set<ReturnType<typeof setTimeout>>();
  private deferTimers = new Set<ReturnType<typeof setTimeout>>();
  // unknown label/state ids a metadata refresh was already started for (never retried, so an id that
  // stays unknown, such as a deleted label still on a work item, cannot loop), and the debounce timer
  private unknownMetadataTried = new Set<string>();
  private unknownMetadataTimer: ReturnType<typeof setTimeout> | undefined;
  private lastPeekFetch = new Map<string, number>();
  private peekTrailingTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private disposed = false;

  private deps: ILiveApplierDeps;

  constructor(deps: ILiveApplierDeps) {
    this.deps = deps;
  }

  dispose() {
    this.disposed = true;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.coarseTimer) clearTimeout(this.coarseTimer);
    if (this.unknownMetadataTimer) clearTimeout(this.unknownMetadataTimer);
    if (this.intakeListTimer) clearTimeout(this.intakeListTimer);
    this.ownActorTimers.forEach((timer) => clearTimeout(timer));
    this.deferTimers.forEach((timer) => clearTimeout(timer));
    this.peekTrailingTimers.forEach((timer) => clearTimeout(timer));
    this.ownActorTimers.clear();
    this.deferTimers.clear();
    this.peekTrailingTimers.clear();
    this.pending.clear();
  }

  /** Entry point for every event of the project. */
  handle(event: TLiveEvent) {
    if (this.disposed || event.project_id !== this.deps.projectId) return;

    if (event.type === "revoked") {
      // access lost: close an open peek (and tell a full-page detail), the lists follow through the coarse refresh
      this.closeOpenIssues(this.getOpenIssueIds());
      this.scheduleCoarse(true);
      return;
    }

    if (event.type === "resync" || event.full_refresh) {
      this.scheduleCoarse(true);
      this.scheduleIntakeList();
      // an open peek is not part of any list, refresh it too
      const peeked = this.getOpenIssueIds();
      // and the intake item open in the intake detail pane
      const intakeOpen = this.openIntakeIssueId();
      if (intakeOpen && !peeked.includes(intakeOpen)) peeked.push(intakeOpen);
      if (peeked.length > 0) this.enqueue(peeked, [changeKey("issue", "updated")]);
      return;
    }

    const currentUserId = this.deps.getCurrentUserId();
    const own: TLiveItem[] = [];
    for (const item of event.items) {
      if (isOwnItem(item, currentUserId)) own.push(item);
      else this.enqueue([item.issue_id], itemChangeKeys(item));
    }
    if (own.length === 0) return;
    // the user's own change is already applied locally: delay it, never drop it
    const timer = setTimeout(() => {
      this.ownActorTimers.delete(timer);
      own.forEach((item) => this.enqueue([item.issue_id], itemChangeKeys(item)));
    }, OWN_ACTOR_DELAY_MS);
    this.ownActorTimers.add(timer);
  }

  private enqueue(issueIds: string[], keys: string[]) {
    if (issueIds.length === 0) return;
    for (const id of issueIds) {
      const kinds = this.pending.get(id) ?? new Set<string>();
      keys.forEach((key) => kinds.add(key));
      this.pending.set(id, kinds);
    }
    const now = Date.now();
    if (!this.debounceTimer) this.debounceStartedAt = now;
    else clearTimeout(this.debounceTimer);
    // trailing debounce, but never wait longer than the max window
    const wait = Math.max(0, Math.min(APPLY_DEBOUNCE_MS, this.debounceStartedAt + APPLY_DEBOUNCE_MAX_MS - now));
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      void this.flush();
    }, wait);
  }

  private scheduleCoarse(all: boolean) {
    if (all) this.coarseAll = true;
    if (this.coarseTimer) return;
    this.coarseTimer = setTimeout(() => {
      this.coarseTimer = undefined;
      const includeAll = this.coarseAll;
      this.coarseAll = false;
      void this.runCoarse(includeAll);
    }, COARSE_DEBOUNCE_MS);
  }

  private async runCoarse(all: boolean) {
    if (this.disposed) return;
    const targets = this.getTargets().filter((target) => all || target.coarse);
    // in place (the board stays on screen), never while the user's edits are in flight or
    // just made, and a stale answer is dropped; either way the refresh is retried a little later
    let retry = false;
    const refreshes: Promise<unknown>[] = targets.map(async (target) => {
      try {
        if ((await target.store.liveRefetch(target.refetch)) !== "applied") retry = true;
      } catch (error: unknown) {
        console.error("live refresh failed", error);
      }
    });
    // a full refresh may carry a state, label, cycle or module definition change: the metadata
    // stores follow it
    if (all) {
      refreshes.push(
        this.deps
          .refreshProjectMetadata()
          .catch((error: unknown) => console.error("live metadata refresh failed", error))
      );
    }
    await Promise.all(refreshes);
    if (retry && !this.disposed) this.scheduleCoarseRetry(all);
    // a full refresh refetched the metadata already; a list-only refresh may bring unknown ids
    if (!all && !this.disposed) {
      const ids = new Set<string>();
      for (const target of targets) listedIssueIds(target.store.groupedIssueIds, ids);
      this.noteUnknownMetadata([...ids].map((id) => this.deps.issueMap.getIssueById(id)));
    }
  }

  /**
   * refreshes the project's metadata once (debounced) when a work item of this project carries a
   * label or state id the stores do not know.
   */
  private noteUnknownMetadata(issues: (TIssue | undefined)[]) {
    const { isKnownLabel, isKnownState, isKnownEstimatePoint, projectId } = this.deps;
    if (!isKnownLabel && !isKnownState && !isKnownEstimatePoint) return;
    let found = false;
    for (const issue of issues) {
      if (!issue || issue.project_id !== projectId) continue;
      const unknown: string[] = [];
      if (isKnownLabel) for (const id of issue.label_ids ?? []) if (!isKnownLabel(id)) unknown.push(id);
      if (isKnownState && issue.state_id && !isKnownState(issue.state_id)) unknown.push(issue.state_id);
      if (isKnownEstimatePoint && issue.estimate_point && !isKnownEstimatePoint(issue.estimate_point))
        unknown.push(issue.estimate_point);
      for (const id of unknown) {
        if (this.unknownMetadataTried.has(id)) continue;
        this.unknownMetadataTried.add(id);
        found = true;
      }
    }
    if (!found || this.unknownMetadataTimer) return;
    this.unknownMetadataTimer = setTimeout(() => {
      this.unknownMetadataTimer = undefined;
      if (this.disposed) return;
      this.deps
        .refreshProjectMetadata()
        .catch((error: unknown) => console.error("live metadata refresh failed", error));
    }, UNKNOWN_METADATA_DEBOUNCE_MS);
  }

  /** runs the deferred full refresh once the user's edits have settled. */
  private scheduleCoarseRetry(all: boolean) {
    if (all) this.coarseAll = true;
    if (this.coarseTimer) return;
    this.coarseTimer = setTimeout(() => {
      this.coarseTimer = undefined;
      const includeAll = this.coarseAll;
      this.coarseAll = false;
      void this.runCoarse(includeAll);
    }, COARSE_RETRY_MS);
  }

  // ---- intake (triage) list ----

  /** The intake store holds this project's list (it is loaded only while the intake route is or was open). */
  private intakeOnScreen(): boolean {
    return !!this.deps.getRoute().intake && this.deps.projectInbox.currentInboxProjectId === this.deps.projectId;
  }

  /** the intake item shown in the intake detail pane, while the intake route is on screen. */
  private openIntakeIssueId(): string | undefined {
    if (!this.intakeOnScreen()) return undefined;
    return this.deps.getRoute().intakeIssueId || undefined;
  }

  /**
   * Known intake items are read one by one (status, snooze, duplicate, the work item fields) and merged into
   * the store, so they move between the open and closed tabs through the store's own filters. An event for
   * an intake item the list does not hold yet (a new submission) refreshes the list instead.
   */
  private async refreshIntake(batch: Map<string, Set<string>>) {
    if (!this.intakeOnScreen()) return;
    const { workspaceSlug, projectId, projectInbox } = this.deps;
    const known: string[] = [];
    let listNeeded = false;
    for (const [id, keys] of batch) {
      if (projectInbox.inboxIssues[id]) known.push(id);
      else if ([...keys].some(isIntakeKey)) listNeeded = true;
    }
    if (listNeeded) this.scheduleIntakeList();
    const openId = this.openIntakeIssueId();
    await Promise.all(
      known.map(async (id) => {
        try {
          const inboxIssue = await this.inboxIssueService.retrieve(workspaceSlug, projectId, id);
          if (this.disposed || !this.intakeOnScreen()) return;
          runInAction(() => projectInbox.createOrUpdateInboxIssue([inboxIssue], workspaceSlug, projectId));
          // the open detail pane also shows the item's comments and activity, which the intake
          // read does not carry; they are refetched like an open peek's (no fetchIssue: the item, name and
          // description included, comes from the intake read above)
          if (id === openId && openId === this.openIntakeIssueId()) await this.refreshIntakeDetail(id, batch.get(id));
        } catch (error) {
          if (!isNotFoundError(error)) throw error;
          // deleted, or no longer an intake item: it leaves the list
          if (this.disposed || !this.intakeOnScreen()) return;
          runInAction(() => {
            projectInbox.inboxIssueIds = projectInbox.inboxIssueIds.filter((value) => value !== id);
            delete projectInbox.inboxIssues[id];
          });
        }
      })
    );
  }

  /** comments (on a comment event) and activity of the intake item open in the detail pane. */
  private async refreshIntakeDetail(issueId: string, keys: Set<string> | undefined) {
    const { workspaceSlug, projectId, issueDetail } = this.deps;
    const kinds = keys ?? new Set<string>();
    try {
      if (hasCommentChange(kinds)) {
        if (shouldResetComments(kinds)) this.resetComments(issueId);
        await issueDetail.fetchComments(workspaceSlug, projectId, issueId, "mutate");
      }
      if (this.disposed) return;
      await issueDetail.fetchActivities(workspaceSlug, projectId, issueId, "mutate");
    } catch (error) {
      console.error("live intake detail refresh failed", error);
    }
  }

  /** Refetches the first page of the intake list in place ("mutation-loading" shows no loader). */
  private scheduleIntakeList() {
    if (this.intakeListTimer || !this.intakeOnScreen()) return;
    this.intakeListTimer = setTimeout(() => {
      this.intakeListTimer = undefined;
      if (this.disposed || !this.intakeOnScreen()) return;
      const { workspaceSlug, projectId, projectInbox } = this.deps;
      projectInbox
        .fetchInboxIssues(workspaceSlug, projectId, "mutation-loading")
        .catch((error: unknown) => console.error("live intake list refresh failed", error));
    }, INTAKE_LIST_DEBOUNCE_MS);
  }

  /** re-enqueues work items whose live read lost to a newer local edit. */
  private deferLocal(ids: string[], batch: Map<string, Set<string>>) {
    if (ids.length === 0) return;
    const timer = setTimeout(() => {
      this.deferTimers.delete(timer);
      ids.forEach((id) => this.enqueue([id], [...(batch.get(id) ?? [changeKey("issue", "updated")])]));
    }, LOCAL_EDIT_RETRY_MS);
    this.deferTimers.add(timer);
  }

  /** The work items open in a detail view: the peek, and the full-page detail route. */
  private getOpenIssueIds(): string[] {
    const ids: string[] = [];
    const peek = this.deps.issueDetail.peekIssue;
    if (peek && peek.projectId === this.deps.projectId) ids.push(peek.issueId);
    const pageIssueId = this.deps.getPageIssueId?.();
    if (pageIssueId && !ids.includes(pageIssueId)) ids.push(pageIssueId);
    return ids;
  }

  /**
   * a workspace view's filter is its rich filter plus, for the built-in views, the condition the
   * store adds to the request (getFilterConditionBasedOnViews): assigned = assignee is me, created = created by
   * me. "subscribed" needs subscriber data the work item does not carry, so that view refetches as a whole.
   */
  private workspaceFilterMode(viewId: string, richFilters: unknown): { coarse: boolean; matches?: TFilterMatcher } {
    if (viewId === "subscribed") return { coarse: true };
    const mode = filterMode(richFilters, this.deps.getStateGroup);
    if (mode.coarse || (viewId !== "assigned" && viewId !== "created")) return mode;
    const userId = this.deps.getCurrentUserId();
    if (!userId) return { coarse: true };
    const fixed: TFilterMatcher =
      viewId === "assigned"
        ? (issue) => (issue.assignee_ids ?? []).includes(userId)
        : (issue) => issue.created_by === userId;
    const rich = mode.matches;
    return { coarse: false, matches: rich ? (issue) => fixed(issue) && rich(issue) : fixed };
  }

  /** The list stores that are on screen for the current route. */
  private getTargets(): TListTarget[] {
    const { workspaceSlug, projectId } = this.deps;
    const route = this.deps.getRoute();
    const targets: TListTarget[] = [];
    if (route.globalViewId && this.deps.workspace) {
      // the workspace view holds work items of many projects; this applier handles its own project's
      const workspace = this.deps.workspace;
      targets.push({
        store: workspace.issues,
        scope: { kind: "project" },
        ...this.workspaceFilterMode(route.globalViewId, workspace.getRichFilters()),
        refetch: workspace.refetch,
      });
    } else if (route.archived) {
      // the per-item read (retrieveIssues) leaves archived work items out, so the archived list is
      // always refreshed as a whole (in place, after the user's own edits have settled; see liveRefetch)
      const store = this.deps.archivedIssues;
      targets.push({
        store,
        scope: { kind: "project" },
        coarse: true,
        refetch: () => store.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation"),
      });
    } else if (route.cycleId) {
      const cycleId = route.cycleId;
      const store = this.deps.cycleIssues;
      targets.push({
        store,
        scope: { kind: "cycle", cycleId },
        ...filterMode(this.deps.getFilterExpression("cycle"), this.deps.getStateGroup),
        refetch: () => store.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation", cycleId),
      });
    } else if (route.moduleId) {
      const moduleId = route.moduleId;
      const store = this.deps.moduleIssues;
      targets.push({
        store,
        scope: { kind: "module", moduleId },
        ...filterMode(this.deps.getFilterExpression("module"), this.deps.getStateGroup),
        refetch: () => store.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation", moduleId),
      });
    } else if (route.viewId) {
      const viewId = route.viewId;
      const store = this.deps.viewIssues;
      targets.push({
        store,
        scope: { kind: "project" },
        // a saved view is a filtered list: per work item when its filter can be evaluated
        ...filterMode(this.deps.getFilterExpression("view"), this.deps.getStateGroup),
        refetch: () => store.fetchIssuesWithExistingPagination(workspaceSlug, projectId, viewId, "mutation"),
      });
    } else {
      const store = this.deps.projectIssues;
      targets.push({
        store,
        scope: { kind: "project" },
        ...filterMode(this.deps.getFilterExpression("project"), this.deps.getStateGroup),
        refetch: () => store.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation"),
      });
    }
    // a store that has never loaded has nothing to update
    return targets.filter((target) => target.store.groupedIssueIds !== undefined);
  }

  private async flush() {
    if (this.disposed || this.pending.size === 0) return;
    const batch = this.pending;
    this.pending = new Map();
    const { workspaceSlug, projectId, issueMap } = this.deps;
    // each work item's local edit counter when its read starts
    const seqAtFetch = new Map<string, number>();
    for (const id of batch.keys()) seqAtFetch.set(id, localEdits.issueSeq(id));

    const fetched = new Map<string, TIssue>();
    const missing: string[] = [];
    // the intake list is updated from its own endpoint, alongside the work item lists
    const intake = this.refreshIntake(batch).catch((error: unknown) =>
      console.error("live intake refresh failed", error)
    );
    try {
      const responses = await Promise.all(
        chunkIds([...batch.keys()]).map(async (chunk) => ({
          chunk,
          issues: await this.issueService.retrieveIssues(workspaceSlug, projectId, chunk),
        }))
      );
      for (const { chunk, issues } of responses) {
        const found = new Set<string>();
        for (const issue of issues ?? []) {
          fetched.set(issue.id, issue);
          found.add(issue.id);
        }
        chunk.forEach((id) => !found.has(id) && missing.push(id));
      }
    } catch (error) {
      // could not tell what changed: fall back to the coarse refresh instead of guessing
      console.error("live work item fetch failed", error);
      this.scheduleCoarse(true);
      return;
    }
    if (this.disposed) return;

    // a work item the user edited after the read started, or whose edit is still in flight,
    // keeps its local state; it is read again later, after the edit has settled
    const lostToLocal = [...batch.keys()].filter(
      (id) => localEdits.isInFlight(id) || localEdits.issueSeq(id) !== seqAtFetch.get(id)
    );
    for (const id of lostToLocal) fetched.delete(id);
    const missingNow = missing.filter((id) => !lostToLocal.includes(id));
    missing.length = 0;
    missing.push(...missingNow);
    this.deferLocal(lostToLocal, batch);

    const targets = this.getTargets();
    const listTargets = targets.filter((target) => !target.coarse);
    const coarseNeeded = targets.some((target) => target.coarse);

    // states before the map is touched, updateIssueList needs them to regroup
    const before = new Map<string, TIssue | undefined>();
    fetched.forEach((_issue, id) => {
      const existing = issueMap.getIssueById(id);
      before.set(id, existing ? clone(existing) : undefined);
    });

    // server changes, not local edits
    localEdits.remote(() =>
      runInAction(() => {
        if (fetched.size > 0) issueMap.addIssue([...fetched.values()]);

        fetched.forEach((_issue, id) => {
          const after = issueMap.getIssueById(id);
          if (!after) return;
          const beforeState = before.get(id);
          for (const target of listTargets) {
            const action = decideStoreAction({
              scope: target.scope,
              projectId,
              issue: after,
              inList: listContainsIssue(target.store.groupedIssueIds, id),
              matches: target.matches,
            });
            if (action === "add") target.store.addIssueToList(id);
            else if (action === "update") target.store.updateIssueList(after, beforeState);
            else if (action === "remove")
              target.store.updateIssueList(undefined, beforeState ?? after, EIssueGroupedAction.DELETE);
          }
        });

        // removeIssueFromList reads the issue map, so the map entry must outlive it. The list endpoint also
        // omits archived, draft and intake work items, so only an issue delete drops the map entry.
        for (const id of missing) {
          for (const target of listTargets) target.store.removeIssueFromList(id);
          if (hasIssueDeleted(batch.get(id) ?? [])) issueMap.removeIssue(id);
        }
      })
    );

    if (coarseNeeded) this.scheduleCoarse(false);
    this.noteUnknownMetadata([...fetched.values()]);
    await intake;
    await this.refreshOpenIssues(batch, new Set(missing.filter((id) => hasIssueDeleted(batch.get(id) ?? []))));
  }

  // ---- peek / detail ----

  private async refreshOpenIssues(batch: Map<string, Set<string>>, deleted: Set<string>) {
    const refreshes: Promise<void>[] = [];
    for (const issueId of this.getOpenIssueIds()) {
      const kinds = batch.get(issueId);
      if (!kinds) continue;
      // the peek of a work item with an edit in flight is refreshed once it has settled
      if (localEdits.isInFlight(issueId)) {
        this.deferLocal([issueId], batch);
        continue;
      }
      if (deleted.has(issueId)) {
        // deleted: never fetchIssue on it
        this.closeOpenIssues([issueId]);
        continue;
      }
      refreshes.push(this.refreshIssueDetail(issueId, kinds));
    }
    await Promise.all(refreshes);
  }

  /**
   * The work items are gone or no longer visible: close the peek if it shows one of them, and say so once.
   * a full-page detail is not closed (it is a route); the toast tells the user.
   */
  private closeOpenIssues(issueIds: string[]) {
    if (issueIds.length === 0) return;
    const peek = this.deps.issueDetail.peekIssue;
    if (peek && issueIds.includes(peek.issueId)) this.deps.issueDetail.setPeekIssue(undefined);
    this.deps.onIssueMissingFromPeek();
  }

  private async refreshIssueDetail(issueId: string, kinds: Set<string>) {
    const { workspaceSlug, projectId, issueDetail } = this.deps;
    const hasCommentEvent = hasCommentChange(kinds);
    // fetchIssue refetches activities and comments itself; otherwise they are refetched here
    const fetchedIssue = this.throttledFetchIssue(issueId, () => {
      if (shouldResetComments(kinds)) this.resetComments(issueId);
    });
    if (fetchedIssue) return;
    try {
      if (hasCommentEvent) {
        if (shouldResetComments(kinds)) this.resetComments(issueId);
        await issueDetail.fetchComments(workspaceSlug, projectId, issueId, "mutate");
      }
      await issueDetail.fetchActivities(workspaceSlug, projectId, issueId, "mutate");
    } catch (error) {
      console.error("live detail refresh failed", error);
    }
  }

  private resetComments(issueId: string) {
    const comments = this.deps.issueDetail.comment.comments;
    runInAction(() => {
      delete comments[issueId];
    });
  }

  private fetchIssueDetail(issueId: string) {
    const { workspaceSlug, projectId, issueDetail } = this.deps;
    issueDetail
      .fetchIssue(workspaceSlug, projectId, issueId)
      // the refreshed detail may carry a label or state the stores do not know yet
      .then(() => this.noteUnknownMetadata([this.deps.issueMap.getIssueById(issueId)]))
      .catch((error: unknown) => {
        // gone or no longer visible: close the peek, anything else is transient
        if (isNotFoundError(error) && this.getOpenIssueIds().includes(issueId)) this.closeOpenIssues([issueId]);
        else console.error("live detail fetch failed", error);
      });
  }

  /**
   * At most one fetchIssue per issue every PEEK_FETCH_THROTTLE_MS. Returns true when a fetch was started now;
   * otherwise a trailing fetch is scheduled and the caller refreshes comments and activities itself.
   */
  private throttledFetchIssue(issueId: string, beforeFetch: () => void): boolean {
    const now = Date.now();
    const last = this.lastPeekFetch.get(issueId) ?? -Infinity;
    if (now - last >= PEEK_FETCH_THROTTLE_MS) {
      this.lastPeekFetch.set(issueId, now);
      beforeFetch();
      this.fetchIssueDetail(issueId);
      return true;
    }
    if (!this.peekTrailingTimers.has(issueId)) {
      const timer = setTimeout(
        () => {
          this.peekTrailingTimers.delete(issueId);
          if (this.disposed || !this.getOpenIssueIds().includes(issueId)) return;
          this.lastPeekFetch.set(issueId, Date.now());
          this.fetchIssueDetail(issueId);
        },
        Math.max(0, PEEK_FETCH_THROTTLE_MS - (now - last))
      );
      this.peekTrailingTimers.set(issueId, timer);
    }
    return false;
  }
}
