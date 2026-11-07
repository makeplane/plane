/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { signSpawnTicket } from "@plane/agent-runner-protocol";

import { trimTrailingSlashes } from "./origin.ts";

/** Whose sign-in, for which adapter: what a `login` ticket claims. */
export interface LoginTarget {
  readonly adapter: string;
  readonly userId: string;
  readonly workspaceId: string;
}

/** The runner's answer: its HTTP status and JSON body (`{}` when there was none). */
export interface RunnerReply {
  readonly status: number;
  readonly body: Record<string, unknown>;
}

/** The runner could not be reached, or did not answer in time. */
export class RunnerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RunnerUnavailableError";
  }
}

/** The runner's sign-in endpoints (`/auth/*`). Each call carries its own single-use `login` ticket. */
export interface LoginRunner {
  start(target: LoginTarget, signal?: AbortSignal): Promise<RunnerReply>;
  status(target: LoginTarget, loginId: string, signal?: AbortSignal): Promise<RunnerReply>;
  complete(target: LoginTarget, loginId: string, code: string, signal?: AbortSignal): Promise<RunnerReply>;
  logout(target: LoginTarget, signal?: AbortSignal): Promise<RunnerReply>;
  /** Whether the stored sign-in is still in the user's agent home: `{connected, account?}`. */
  account(target: LoginTarget, signal?: AbortSignal): Promise<RunnerReply>;
}

export interface RunnerLoginClientOptions {
  /** Runner HTTP origin, e.g. `http://agent-runner:3410`. */
  readonly baseUrl: string;
  /** Signs the tickets (`AGENT_RUNNER_SECRET`). */
  readonly secret: string;
  /** Longer than the runner's own 30 s waits. */
  readonly timeoutMs?: number;
  readonly fetch?: typeof fetch;
}

/** `LoginRunner` over HTTP. The ticket goes in `Authorization` and is never logged. */
export class RunnerLoginClient implements LoginRunner {
  readonly #base: string;
  readonly #secret: string;
  readonly #timeoutMs: number;
  readonly #fetch: typeof fetch;

  constructor(options: RunnerLoginClientOptions) {
    this.#base = trimTrailingSlashes(options.baseUrl);
    this.#secret = options.secret;
    this.#timeoutMs = options.timeoutMs ?? 40_000;
    this.#fetch = options.fetch ?? fetch;
  }

  start(target: LoginTarget, signal?: AbortSignal): Promise<RunnerReply> {
    return this.#call(target, "POST", "/auth/start", undefined, signal);
  }

  status(target: LoginTarget, loginId: string, signal?: AbortSignal): Promise<RunnerReply> {
    return this.#call(target, "GET", `/auth/status?loginId=${encodeURIComponent(loginId)}`, undefined, signal);
  }

  complete(target: LoginTarget, loginId: string, code: string, signal?: AbortSignal): Promise<RunnerReply> {
    return this.#call(target, "POST", "/auth/complete", { loginId, code }, signal);
  }

  logout(target: LoginTarget, signal?: AbortSignal): Promise<RunnerReply> {
    return this.#call(target, "POST", "/auth/logout", undefined, signal);
  }

  account(target: LoginTarget, signal?: AbortSignal): Promise<RunnerReply> {
    return this.#call(target, "GET", "/auth/account", undefined, signal);
  }

  async #call(
    target: LoginTarget,
    method: "GET" | "POST",
    path: string,
    body: unknown,
    signal?: AbortSignal
  ): Promise<RunnerReply> {
    const ticket = signSpawnTicket(
      {
        adapter: target.adapter,
        env: {},
        userId: target.userId,
        workspaceId: target.workspaceId,
        initialMode: "ask_all",
        purpose: "login",
      },
      this.#secret
    );
    const timeout = AbortSignal.timeout(this.#timeoutMs);
    let response: Response;
    try {
      response = await this.#fetch(`${this.#base}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${ticket}`,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        redirect: "manual",
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    } catch (error) {
      throw new RunnerUnavailableError(`agent runner request failed: ${(error as Error).message}`);
    }
    let parsed: unknown = {};
    try {
      const text = await response.text();
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = {};
    }
    const record = typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    return { status: response.status, body: record as Record<string, unknown> };
  }
}
