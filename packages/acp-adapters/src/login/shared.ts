/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { rmSync } from "node:fs";
import path from "node:path";

export type LoginEvent =
  | { event: "pending"; verificationUrl: string; userCode?: string; needsCode: boolean }
  | { event: "connected"; account: Record<string, string | null> }
  | { event: "failed"; error: string }
  | { event: "disconnected" }
  | { event: "status"; connected: boolean; account?: Record<string, string | null> };

export interface LoginIo {
  readonly env: NodeJS.ProcessEnv;
  readonly home: string;
  emit(event: LoginEvent): void;
  /** The next stdin line parsed as JSON, or `undefined` at EOF. */
  readLine(): Promise<unknown>;
  log(message: string): void;
  /** Aborts on SIGTERM/SIGINT. */
  readonly signal: AbortSignal;
}

/** Remove files, ignoring the ones that are not there. */
export function removeFiles(...files: string[]): void {
  for (const file of files) rmSync(file, { force: true });
}

export function codexHomeOf(home: string): string {
  return path.join(home, ".codex");
}

export type Outcome<T> = { readonly value: T } | { readonly stopped: "timeout" | "signal" };

/** Wait for `promise`, giving up after `ms` or when `signal` aborts. */
export async function within<T>(promise: Promise<T>, signal: AbortSignal, ms: number): Promise<Outcome<T>> {
  if (signal.aborted) return { stopped: "signal" };
  let timer: NodeJS.Timeout | undefined;
  let onAbort: (() => void) | undefined;
  const stopped = new Promise<Outcome<T>>((resolve) => {
    timer = setTimeout(() => resolve({ stopped: "timeout" }), ms);
    onAbort = () => resolve({ stopped: "signal" });
    signal.addEventListener("abort", onAbort, { once: true });
  });
  try {
    return await Promise.race([promise.then((value) => ({ value })), stopped]);
  } finally {
    clearTimeout(timer);
    if (onAbort) signal.removeEventListener("abort", onAbort);
  }
}

export function failed(error: string): LoginEvent {
  return { event: "failed", error };
}
