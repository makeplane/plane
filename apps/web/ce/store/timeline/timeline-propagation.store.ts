/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// mobx
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { TimelinePropagationService } from "@plane/services";
import type {
  TTimelinePropagationError,
  TTimelinePropagationRequest,
  TTimelinePropagationResponse,
} from "@plane/types";
import { computeLoadedPreview, diffHiddenUpdate, type LoadedGraphEdge, type LoadedWorkItem } from "@plane/utils";
// plane web
import type { RootStore } from "@/plane-web/store/root.store";

/**
 * Snapshot captured at beginPreview (D-05b) — frozen view of the world at
 * drag-start so an unrelated socket event doesn't redraw the preview against
 * new positions mid-drag.
 */
type PropagationSnapshot = {
  edges: readonly LoadedGraphEdge[];
  items_by_id: Readonly<Record<string, LoadedWorkItem>>;
  expected_updated_at: string;
  dragged: {
    id: string;
    original_start_date: string;
    original_target_date: string;
  };
};

export interface ITimelinePropagationStore {
  // observables
  previewById: Map<string, { start_date: string; target_date: string }>;
  isPreviewActive: boolean;
  lastError: TTimelinePropagationError | null;
  lastResponse: TTimelinePropagationResponse | null;
  lastPreviewIds: ReadonlySet<string> | null;
  unexpectedError: Error | null;

  // computeds
  hiddenUpdateCount: number;

  // actions
  beginPreview(args: {
    dragged_id: string;
    original_start_date: string;
    original_target_date: string;
    expected_updated_at: string;
    edges: readonly LoadedGraphEdge[];
    items_by_id: Readonly<Record<string, LoadedWorkItem>>;
  }): void;

  updatePreview(args: { requested_start_date: string; requested_target_date: string }): void;

  commitWithServerResult(args: {
    workspaceSlug: string;
    projectId: string;
    requested_start_date: string;
    requested_target_date: string;
  }): Promise<TTimelinePropagationResponse | TTimelinePropagationError>;

  rollback(): void;
}

/**
 * MobX store for advisory loaded-graph preview during a Work Item drag plus
 * server-authoritative commit / rollback. Phase 4 ships ZERO UI behavior; this
 * store is the seam Phase 5's drag handler will consume.
 *
 * State machine (D-05a):
 *   IDLE → (beginPreview) → PREVIEWING
 *   PREVIEWING → (updatePreview) → PREVIEWING
 *   PREVIEWING → (commit success) → IDLE   (issues map written via RootStore.issue.issues.updateIssue)
 *   PREVIEWING → (commit failure) → IDLE   (preview discarded; lastError or unexpectedError set)
 *   PREVIEWING → (rollback) → IDLE
 *
 * Error split (D-05c): `lastError` carries one of the 7 wire codes; non-protocol
 * errors (network, 5xx, missing `code` on thrown body) go to `unexpectedError`.
 *
 * @remarks
 * The store does NOT inspect MobX trees on its own (D-07). Phase 5 supplies
 * `edges` + `items_by_id` + `expected_updated_at` to `beginPreview`; the store
 * snapshots them and recomputes the preview on `updatePreview`.
 */
export class TimelinePropagationStore implements ITimelinePropagationStore {
  // observables (D-05 / D-05e)
  previewById: Map<string, { start_date: string; target_date: string }> = new Map();
  isPreviewActive = false;
  lastError: TTimelinePropagationError | null = null;
  lastResponse: TTimelinePropagationResponse | null = null;
  lastPreviewIds: ReadonlySet<string> | null = null;
  unexpectedError: Error | null = null;

  // private fields
  private rootStore: RootStore;
  private service: TimelinePropagationService;
  private snapshot: PropagationSnapshot | null = null;
  // shared in-flight commit promise (D-08a / Pitfall 7)
  private inflightCommit: Promise<TTimelinePropagationResponse | TTimelinePropagationError> | null = null;

  constructor(rootStore: RootStore) {
    makeObservable(this, {
      // observables — Map deep, replaced refs `.ref` (Pitfall 3)
      previewById: observable,
      isPreviewActive: observable.ref,
      lastError: observable.ref,
      lastResponse: observable.ref,
      lastPreviewIds: observable.ref,
      unexpectedError: observable.ref,
      // computed
      hiddenUpdateCount: computed,
      // actions
      beginPreview: action.bound,
      updatePreview: action.bound,
      commitWithServerResult: action.bound,
      rollback: action.bound,
    });

    this.rootStore = rootStore;
    this.service = new TimelinePropagationService();
  }

  /**
   * D-05e + Pitfall 6: compute against `lastPreviewIds` snapshot (NOT
   * `previewById.keys()`) because the success path clears `previewById` to
   * IDLE before the UI reads `hiddenUpdateCount`.
   */
  get hiddenUpdateCount(): number {
    if (!this.lastResponse || !this.lastPreviewIds) return 0;
    return diffHiddenUpdate(this.lastResponse.work_items, this.lastPreviewIds);
  }

  /**
   * Begin a new preview. Silently replaces any active preview (D-08 — letting
   * go of the mouse always ends a drag; new mousedown shouldn't block on stale
   * state). Snapshots `edges` + `items_by_id` + `expected_updated_at` once.
   */
  beginPreview(args: {
    dragged_id: string;
    original_start_date: string;
    original_target_date: string;
    expected_updated_at: string;
    edges: readonly LoadedGraphEdge[];
    items_by_id: Readonly<Record<string, LoadedWorkItem>>;
  }): void {
    runInAction(() => {
      this.previewById.clear();
      this.isPreviewActive = true;
      this.lastError = null;
      this.lastResponse = null;
      this.lastPreviewIds = null;
      this.unexpectedError = null;
      this.snapshot = {
        edges: args.edges,
        items_by_id: args.items_by_id,
        expected_updated_at: args.expected_updated_at,
        dragged: {
          id: args.dragged_id,
          original_start_date: args.original_start_date,
          original_target_date: args.original_target_date,
        },
      };
    });
  }

  /**
   * Recompute the preview against the snapshot taken at beginPreview (D-05b —
   * never re-reads the timeline store mid-drag). No-op if no preview is active.
   */
  updatePreview(args: { requested_start_date: string; requested_target_date: string }): void {
    if (!this.isPreviewActive || !this.snapshot) return; // D-05a stale-call no-op
    const snap = this.snapshot;
    const next = computeLoadedPreview(snap.edges, snap.items_by_id, {
      id: snap.dragged.id,
      original_start_date: snap.dragged.original_start_date,
      original_target_date: snap.dragged.original_target_date,
      requested_start_date: args.requested_start_date,
      requested_target_date: args.requested_target_date,
    });
    runInAction(() => {
      this.previewById.clear();
      for (const [id, dates] of next) {
        this.previewById.set(id, dates);
      }
    });
  }

  /**
   * Send the move intent to the server. Returns a UNION (not throws — D-05c).
   * Re-entrant calls share the in-flight promise (D-08a / Pitfall 7).
   *
   * Success: writes server work_items into the canonical issues map via
   * `rootStore.issue.issues.updateIssue(id, Partial<TIssue>)` once per entry,
   * wrapped in a single outer `runInAction` so MobX batches the N writes
   * (Pitfall 8). Captures `lastPreviewIds` BEFORE clearing `previewById`
   * (Pitfall 6).
   *
   * Failure: discards `previewById`. If the thrown body has a `code` matching
   * a wire error code, sets `lastError`; otherwise sets `unexpectedError`
   * (D-05c — no synthetic 8th code).
   *
   * Stale call (no preview active) returns a synthetic local-only error
   * envelope per D-05a — NOT one of the 7 server codes.
   */
  async commitWithServerResult(args: {
    workspaceSlug: string;
    projectId: string;
    requested_start_date: string;
    requested_target_date: string;
  }): Promise<TTimelinePropagationResponse | TTimelinePropagationError> {
    if (this.inflightCommit) return this.inflightCommit;
    if (!this.isPreviewActive || !this.snapshot) {
      // D-05a: stale call. Surface a synthetic local-only failure that is
      // distinguishable from the 7 wire codes — the {code, message} shape
      // is reused so Phase 5 has a uniform branch surface, but Phase 5 should
      // never await without an active preview.
      const localError: TTimelinePropagationError = {
        code: "INVALID_DATE_RANGE",
        message: "No active preview to commit.",
      };
      runInAction(() => {
        this.lastError = localError;
        this.unexpectedError = null;
      });
      return localError;
    }

    this.inflightCommit = this._doCommit(args);
    try {
      return await this.inflightCommit;
    } finally {
      this.inflightCommit = null;
    }
  }

  private async _doCommit(args: {
    workspaceSlug: string;
    projectId: string;
    requested_start_date: string;
    requested_target_date: string;
  }): Promise<TTimelinePropagationResponse | TTimelinePropagationError> {
    const snap = this.snapshot as PropagationSnapshot;

    const body: TTimelinePropagationRequest = {
      work_item_id: snap.dragged.id,
      original_start_date: snap.dragged.original_start_date,
      original_target_date: snap.dragged.original_target_date,
      expected_updated_at: snap.expected_updated_at,
      requested_start_date: args.requested_start_date,
      requested_target_date: args.requested_target_date,
      operation: "move",
      client_preview_count: this.previewById.size,
    };

    // Capture preview ids BEFORE the network call so we can attribute hidden
    // updates even if `previewById` is cleared by another beginPreview during
    // the in-flight window (Pitfall 6 — concurrent drag re-entry).
    const previewIdsAtSend: ReadonlySet<string> = new Set(this.previewById.keys());

    try {
      const response = await this.service.propagateMove(args.workspaceSlug, args.projectId, body);

      // D-05e + Pitfall 6: capture lastPreviewIds BEFORE clearing previewById.
      // Pitfall 8: wrap the per-id updateIssue loop in a SINGLE outer
      // runInAction so MobX batches the N writes into one reaction.
      runInAction(() => {
        this.lastPreviewIds = previewIdsAtSend;
        this.lastResponse = response;
        this.lastError = null;
        this.unexpectedError = null;
        this.previewById.clear();
        this.isPreviewActive = false;
        this.snapshot = null;
        for (const wi of response.work_items) {
          this.rootStore.issue.issues.updateIssue(wi.id, {
            start_date: wi.start_date,
            target_date: wi.target_date,
            planned_duration_working_days: wi.planned_duration_working_days,
            updated_at: wi.updated_at,
          });
        }
      });
      return response;
    } catch (thrown: unknown) {
      // D-05c: split protocol vs non-protocol failures. Service throws the
      // {code, message} body on 4xx; raw Error on network/5xx.
      const isProtocol = _isProtocolError(thrown);
      runInAction(() => {
        this.previewById.clear();
        this.isPreviewActive = false;
        this.snapshot = null;
        if (isProtocol) {
          this.lastError = thrown;
          this.unexpectedError = null;
        } else {
          this.lastError = null;
          this.unexpectedError = thrown instanceof Error ? thrown : new Error(String(thrown));
        }
      });
      return isProtocol
        ? thrown
        : ({ code: "INVALID_DATE_RANGE", message: "Network or server error." } satisfies TTimelinePropagationError);
    }
  }

  /**
   * Discard the active preview without contacting the server. Used by Esc-cancel
   * in Phase 5. Idempotent; no-op when no preview is active.
   */
  rollback(): void {
    runInAction(() => {
      this.previewById.clear();
      this.isPreviewActive = false;
      this.snapshot = null;
      // Do NOT clear lastError / lastResponse — those describe the previous
      // commit's outcome and Phase 5 may still want to render them.
    });
  }
}

/**
 * Internal: shape-discriminate a thrown value as a wire-protocol error envelope.
 * D-05c — only `{ code: <one of 7>, message: string }` qualifies.
 */
function _isProtocolError(value: unknown): value is TTimelinePropagationError {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.code !== "string") return false;
  if (typeof v.message !== "string") return false;
  const codes: ReadonlySet<string> = new Set([
    "DEPENDENCY_CYCLE",
    "PROJECT_BOUNDARY_EXCEEDED",
    "INCOMPLETE_SCHEDULE",
    "PROPAGATION_LIMIT_EXCEEDED",
    "SCHEDULE_CHANGED",
    "PERMISSION_DENIED",
    "INVALID_DATE_RANGE",
  ]);
  return codes.has(v.code);
}
