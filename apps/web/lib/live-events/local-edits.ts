/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * the user's own work item edits, as the live applier needs to see them.
 *
 * A local edit (a drag, a property change in the peek, a quick action) updates the board optimistically and
 * then PATCHes the server. Until the PATCH has been processed, any server read of that work item (a
 * per-item live fetch, the peek refresh, or a full list refetch) can return the state from before the edit
 * and would move the card back. This module counts the edits so readers can tell:
 *
 * - seq(): a counter that moves on every local list change (optimistic updates, reverts, creates, deletes);
 *   a full refetch whose seq changed between request and response is stale and must not be applied.
 * - issueSeq(id) / isInFlight(id): the same per work item, for the per-item live fetches.
 * - anyInFlight() / msSinceLastEdit(): a full refetch waits until the user's edits have settled.
 *
 * Changes the live applier itself applies run inside remote(), so they do not count as local edits.
 * Plain module state: one board is on screen at a time, and nothing here is rendered.
 */

/** A full refetch waits this long after the user's last local edit (a burst of moves settles first). */
export const LOCAL_QUIET_MS = 1500;

let seq = 0;
let lastEditAt = 0;
let remoteDepth = 0;
const issueSeqs = new Map<string, number>();
const inFlight = new Map<string, number>();

const touch = (issueId?: string) => {
  if (remoteDepth > 0) return;
  seq++;
  lastEditAt = Date.now();
  if (issueId) issueSeqs.set(issueId, seq);
};

export const localEdits = {
  /** A local list change (optimistic move, revert, create, delete). Ignored inside remote(). */
  touch,

  /** Starts an edit that waits for the server. Call the returned function once the request has settled. */
  begin(issueId: string): () => void {
    touch(issueId);
    inFlight.set(issueId, (inFlight.get(issueId) ?? 0) + 1);
    let ended = false;
    return () => {
      if (ended) return;
      ended = true;
      const left = (inFlight.get(issueId) ?? 1) - 1;
      if (left > 0) inFlight.set(issueId, left);
      else inFlight.delete(issueId);
      // the server state changed when the request settled: reads started before now are stale
      touch(issueId);
    };
  },

  seq: () => seq,
  issueSeq: (issueId: string) => issueSeqs.get(issueId) ?? 0,
  isInFlight: (issueId: string) => inFlight.has(issueId),
  anyInFlight: () => inFlight.size > 0,
  msSinceLastEdit: () => Date.now() - lastEditAt,

  /** Runs changes that come from the server (the live applier), so they are not counted as local edits. */
  remote<T>(fn: () => T): T {
    remoteDepth++;
    try {
      return fn();
    } finally {
      remoteDepth--;
    }
  },
};
