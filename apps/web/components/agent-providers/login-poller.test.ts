/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentConnectionError } from "@plane/services";
import type { TAgentConnectionStatus } from "@plane/types";
import { abortableSleep, pollLoginStatus } from "./login-poller";

/** Answers each check from the list; an Error entry is thrown. */
const scripted = (answers: (TAgentConnectionStatus | Error)[]) => {
  const check = vi.fn(async () => {
    const next = answers.shift();
    if (!next) throw new Error("no more answers");
    if (next instanceof Error) throw next;
    return next;
  });
  return check;
};

const noSleep = vi.fn(async () => undefined);

describe("pollLoginStatus", () => {
  afterEach(() => {
    vi.useRealTimers();
    noSleep.mockClear();
  });

  it("waits one interval between checks until the sign-in is connected", async () => {
    const check = scripted([
      { status: "pending" },
      { status: "pending" },
      { status: "connected", account: { email: "a@b.c" } },
    ]);
    const result = await pollLoginStatus({
      check,
      intervalMs: 3000,
      signal: new AbortController().signal,
      sleep: noSleep,
    });
    expect(result).toEqual({ status: "connected", account: { email: "a@b.c" } });
    expect(check).toHaveBeenCalledTimes(3);
    expect(noSleep).toHaveBeenCalledTimes(3);
    expect(noSleep).toHaveBeenCalledWith(3000, expect.any(AbortSignal));
  });

  it("stops on a failed sign-in with the helper's error", async () => {
    const check = scripted([{ status: "failed", error: "Device code expired" }]);
    const result = await pollLoginStatus({
      check,
      intervalMs: 1,
      signal: new AbortController().signal,
      sleep: noSleep,
    });
    expect(result).toEqual({ status: "failed", reason: "failed", error: "Device code expired" });
  });

  it("treats an unknown login (404) as expired", async () => {
    const check = scripted([new AgentConnectionError(404, "Unknown login")]);
    const result = await pollLoginStatus({
      check,
      intervalMs: 1,
      signal: new AbortController().signal,
      sleep: noSleep,
    });
    expect(result).toEqual({ status: "failed", reason: "expired" });
  });

  it("retries a briefly unreachable bridge, then gives up after three errors in a row", async () => {
    const recovered = scripted([new AgentConnectionError(502, "down"), { status: "connected" }]);
    await expect(
      pollLoginStatus({ check: recovered, intervalMs: 1, signal: new AbortController().signal, sleep: noSleep })
    ).resolves.toEqual({ status: "connected" });

    const down = scripted([0, 0, 0].map(() => new AgentConnectionError(0, "offline")));
    await expect(
      pollLoginStatus({ check: down, intervalMs: 1, signal: new AbortController().signal, sleep: noSleep })
    ).resolves.toEqual({ status: "failed", reason: "unreachable" });
    expect(down).toHaveBeenCalledTimes(3);
  });

  it("stops polling when cancelled, without another check", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const check = scripted([{ status: "pending" }, { status: "pending" }]);
    const result = pollLoginStatus({ check, intervalMs: 3000, signal: controller.signal });
    await vi.advanceTimersByTimeAsync(3000);
    expect(check).toHaveBeenCalledTimes(1);
    controller.abort();
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(result).resolves.toEqual({ status: "cancelled" });
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("ignores a check that finishes after cancelling", async () => {
    const controller = new AbortController();
    const check = vi.fn(async () => {
      controller.abort();
      return { status: "connected" } as const;
    });
    await expect(pollLoginStatus({ check, intervalMs: 1, signal: controller.signal, sleep: noSleep })).resolves.toEqual(
      { status: "cancelled" }
    );
  });
});

describe("abortableSleep", () => {
  it("resolves early on abort", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const sleeping = abortableSleep(60_000, controller.signal);
    controller.abort();
    await vi.advanceTimersByTimeAsync(0);
    await expect(sleeping).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it("resolves after the delay", async () => {
    vi.useFakeTimers();
    const sleeping = abortableSleep(1000, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(sleeping).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
