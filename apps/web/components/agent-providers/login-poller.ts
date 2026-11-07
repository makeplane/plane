/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TAgentConnectionAccount, TAgentConnectionStatus } from "@plane/types";
// local imports
import { isTransientSignInError, signInErrorReason } from "./helpers";
import type { TSignInErrorReason } from "./helpers";

export type TLoginPollResult =
  | { status: "connected"; account?: TAgentConnectionAccount }
  | { status: "failed"; reason: TSignInErrorReason; error?: string }
  | { status: "cancelled" };

export type TLoginPollOptions = {
  /** Asks the bridge where the sign-in stands. */
  check: (signal: AbortSignal) => Promise<TAgentConnectionStatus>;
  intervalMs: number;
  /** Aborting stops polling; the result is then `cancelled`. */
  signal: AbortSignal;
  /** Unreachable-bridge errors in a row before giving up. */
  maxConsecutiveErrors?: number;
  /** Injectable for tests. Resolves after `ms`, or early when `signal` aborts. */
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
};

export function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const elapsed = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, ms);
  });
  const aborted = new Promise<void>((resolve) => {
    signal.addEventListener("abort", () => resolve(), { once: true });
  });
  return Promise.race([elapsed, aborted]).finally(() => clearTimeout(timer));
}

/**
 * Polls a pending account sign-in every `intervalMs` until it is connected or failed, or until
 * `signal` aborts. The first check waits one interval (the member is still on the sign-in page).
 * A sign-in the bridge no longer knows (404) has expired. A briefly unreachable bridge is retried;
 * any other error ends polling.
 */
export async function pollLoginStatus(options: TLoginPollOptions): Promise<TLoginPollResult> {
  const { check, intervalMs, signal, maxConsecutiveErrors = 3, sleep = abortableSleep } = options;
  const cancelled: TLoginPollResult = { status: "cancelled" };

  // One poll per call; the next one is chained after the interval (sequential by design).
  const poll = async (consecutiveErrors: number): Promise<TLoginPollResult> => {
    await sleep(intervalMs, signal);
    if (signal.aborted) return cancelled;
    let result: TAgentConnectionStatus;
    try {
      result = await check(signal);
    } catch (error) {
      if (signal.aborted) return cancelled;
      const errors = consecutiveErrors + 1;
      if (isTransientSignInError(error) && errors < maxConsecutiveErrors) return poll(errors);
      return { status: "failed", reason: signInErrorReason(error) };
    }
    if (signal.aborted) return cancelled;
    if (result.status === "connected")
      return { status: "connected", ...(result.account ? { account: result.account } : {}) };
    if (result.status === "failed")
      return { status: "failed", reason: "failed", ...(result.error ? { error: result.error } : {}) };
    return poll(0);
  };

  return signal.aborted ? cancelled : poll(0);
}
