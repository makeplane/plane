/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Hocuspocus } from "@hocuspocus/server";

/** Keep persistence and Redis available until body/title saves and unload hooks finish. */
export async function drainCollaborationServer(instance: Hocuspocus, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const timeoutMessage = "Collaboration shutdown timed out while waiting for document persistence";
  const beforeDeadline = async <T>(operation: Promise<T>): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error(timeoutMessage)), Math.max(0, deadline - Date.now()));
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };
  // One failed save must not abort the others: record it, skip it on later passes, and report after the drain.
  const failures = new Map<string, unknown>();
  const pendingDocuments = () => [...instance.documents.values()].filter((document) => !failures.has(document.name));
  instance.closeConnections();
  while (pendingDocuments().length || instance.loadingDocuments.size || instance.unloadingDocuments.size) {
    if (Date.now() >= deadline) throw new Error(timeoutMessage);
    const documents = pendingDocuments();
    // oxlint-disable-next-line no-await-in-loop -- each pass waits for the previous one's saves
    const results = await Promise.allSettled(
      documents.map(async (document) => {
        await beforeDeadline(Promise.resolve(instance.debouncer.executeNow(`onStoreDocument-${document.name}`)));
        // executeNow has no promise for a save whose timer already fired.
        while (instance.debouncer.isCurrentlyExecuting(`onStoreDocument-${document.name}`)) {
          // oxlint-disable-next-line no-await-in-loop -- polling until the running save finishes
          await beforeDeadline(new Promise((resolve) => setTimeout(resolve, 10)));
        }
        await beforeDeadline(instance.unloadDocument(document));
      })
    );
    results.forEach((result, index) => {
      if (result.status !== "rejected") return;
      if (result.reason instanceof Error && result.reason.message === timeoutMessage) throw result.reason;
      failures.set(documents[index].name, result.reason);
    });
    // oxlint-disable-next-line no-await-in-loop -- polling until loads and unloads settle
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  if (failures.size) {
    throw new AggregateError(
      [...failures.values()],
      `Failed to persist ${failures.size} document(s) during shutdown: ${[...failures.keys()].join(", ")}`
    );
  }
  await beforeDeadline(instance.hooks("onDestroy", { instance }));
}

/** One deadline covers HTTP close, body saves and title unload hooks. */
export async function withinShutdownDeadline<T>(
  operation: (remainingMs: () => number) => Promise<T>,
  timeoutMs = 60_000
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(() => Math.max(1, deadline - Date.now())),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Collaboration shutdown timed out")), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
