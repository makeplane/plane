/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * one PATCH at a time per work item.
 *
 * Two quick edits of the same work item (a card dragged A->B->C) used to send two concurrent PATCHes, which
 * the API can process in either order, so the earlier edit could win. Here a work item has at most one
 * request in flight. Edits made meanwhile are merged into one pending payload (later fields win), sent when
 * the request in flight settles: A->B->C sends B and then C, or only C when B has not started.
 *
 * The board is still updated at once (optimistically) by the caller; only the server writes are serialized.
 *
 * On a failed request the work item goes back to its last confirmed server state, for every field of the
 * failed payload and of the merged payload that was waiting behind it (that one is not sent). The rollback
 * runs once, here, not in every caller: a caller's own "before" may be an optimistic state that never
 * reached the server. Every waiting caller then gets the error.
 */

import type { TIssue } from "@plane/types";

type TWaiter = { resolve: () => void; reject: (error: unknown) => void };

type TEntry = {
  /** the last state the server confirmed (or held before the first edit of this run) */
  confirmed: Partial<TIssue>;
  /** fields not yet sent, merged; undefined when nothing waits */
  pending: { data: Partial<TIssue>; waiters: TWaiter[] } | undefined;
  running: boolean;
  send: (payload: Partial<TIssue>) => Promise<unknown>;
  rollback: (revert: Partial<TIssue>) => void;
};

const entries = new Map<string, TEntry>();

const pickFields = (source: Partial<TIssue>, keys: string[]): Partial<TIssue> => {
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = (source as Record<string, unknown>)[key];
  return out as Partial<TIssue>;
};

const pump = async (issueId: string, entry: TEntry) => {
  entry.running = true;
  while (entry.pending) {
    const batch = entry.pending;
    entry.pending = undefined;
    try {
      // sends whatever the latest caller provided, so the request uses the current route and service.
      // One request at a time is the point of this queue, so the await stays in the loop.
      // oxlint-disable-next-line no-await-in-loop
      await entry.send(batch.data);
      entry.confirmed = { ...entry.confirmed, ...batch.data };
      batch.waiters.forEach((waiter) => waiter.resolve());
    } catch (error) {
      // the payload waiting behind it is dropped: both go back to the confirmed server state
      const dropped = entry.pending as TEntry["pending"];
      entry.pending = undefined;
      const keys = [...new Set([...Object.keys(batch.data), ...Object.keys(dropped?.data ?? {})])];
      try {
        entry.rollback(pickFields(entry.confirmed, keys));
      } catch (rollbackError) {
        console.error("work item rollback failed", rollbackError);
      }
      batch.waiters.forEach((waiter) => waiter.reject(error));
      dropped?.waiters.forEach((waiter) => waiter.reject(error));
    }
  }
  entry.running = false;
  entries.delete(issueId);
};

export const issueSyncQueue = {
  /**
   * Queues `data` for the work item and resolves when the request that carries it has settled.
   * `confirmedBase` is the work item before this edit; it is used only when no request is queued yet.
   */
  enqueue(params: {
    issueId: string;
    data: Partial<TIssue>;
    confirmedBase: Partial<TIssue> | undefined;
    send: (payload: Partial<TIssue>) => Promise<unknown>;
    rollback: (revert: Partial<TIssue>) => void;
  }): Promise<void> {
    const { issueId, data, confirmedBase, send, rollback } = params;
    let entry = entries.get(issueId);
    if (!entry) {
      entry = { confirmed: { ...confirmedBase }, pending: undefined, running: false, send, rollback };
      entries.set(issueId, entry);
    }
    // the latest caller's store sends and rolls back
    entry.send = send;
    entry.rollback = rollback;
    const pending = entry.pending ?? { data: {}, waiters: [] };
    pending.data = { ...pending.data, ...data };
    entry.pending = pending;
    const done = new Promise<void>((resolve, reject) => pending.waiters.push({ resolve, reject }));
    if (!entry.running) void pump(issueId, entry);
    return done;
  },

  /** True while a request for the work item is in flight or waiting. */
  isBusy: (issueId: string) => entries.has(issueId),
};
