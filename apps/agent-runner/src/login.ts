/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { randomUUID } from "node:crypto";
import type { ChildProcess, SpawnOptions } from "node:child_process";

import type { SpawnTicket } from "@plane/agent-runner-protocol";

import { defaultKiller, defaultSpawner, type Killer, type Spawner } from "./agent-process.ts";
import type { HelperCommand, LoginAdapterId } from "./bins.ts";
import type { Logger } from "./logger.ts";
import type { WorkspaceLayout } from "./workspace.ts";

/**
 * Provider sign-in (ChatGPT for codex, Google for gemini), driven by the `plane-agent-login` helper
 * from `@plane/acp-adapters`. The helper runs exactly like an agent: as the workspace dir's uid, in
 * its own process group, with `HOME` the agent's own home (so the agent finds the credentials it
 * writes there) and an env built from nothing. It talks newline-delimited JSON: events on stdout,
 * `{"code"}` lines on stdin.
 *
 * Nothing the helper prints on stdout is logged: it carries verification URLs and device codes.
 */

export type LoginAction = "start" | "logout" | "status";
export type LoginStatus = "pending" | "connected" | "failed";

export interface LoginAccount {
  readonly email?: string;
  readonly plan?: string;
}

/** What the runner reports about one sign-in. */
export interface LoginState {
  readonly status: LoginStatus;
  readonly account?: LoginAccount;
  readonly error?: string;
}

export interface LoginStarted {
  readonly loginId: string;
  readonly verificationUrl: string;
  readonly userCode?: string;
  readonly needsCode: boolean;
}

/** A refusal the HTTP layer turns into `{error}` with this status. */
export interface LoginFailure {
  readonly ok: false;
  readonly status: number;
  readonly error: string;
  /** The helper itself reported (or caused) the failure, as opposed to the runner refusing. */
  readonly reason?: "helper_failed" | "timeout";
}

export interface LoginTimeouts {
  /** How long `start` waits for the helper's first event. */
  readonly startMs: number;
  /** How long `complete` waits for the helper to finish after the code is sent. */
  readonly completeMs: number;
  /** How long `logout` waits for the helper. */
  readonly logoutMs: number;
  /** A sign-in still pending after this long is killed. */
  readonly lifetimeMs: number;
  /** How long a finished sign-in's result stays readable. */
  readonly resultTtlMs: number;
  /** After a final event, how long the helper has to exit by itself before it is stopped. */
  readonly lingerMs: number;
}

export const DEFAULT_LOGIN_TIMEOUTS: LoginTimeouts = {
  startMs: 30_000,
  completeMs: 30_000,
  logoutMs: 30_000,
  lifetimeMs: 15 * 60_000,
  resultTtlMs: 5 * 60_000,
  lingerMs: 5_000,
};

const MAX_LINE_BYTES = 64 * 1024;
const STDERR_TAIL_LINES = 20;

type HelperEvent =
  | {
      readonly event: "pending";
      readonly verificationUrl: string;
      readonly userCode?: string;
      readonly needsCode: boolean;
    }
  | { readonly event: "connected"; readonly account: LoginAccount }
  | { readonly event: "failed"; readonly error: string }
  | { readonly event: "disconnected" }
  | { readonly event: "status"; readonly connected: boolean; readonly account?: LoginAccount };

function shortString(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.length > 0 ? value.slice(0, max) : undefined;
}

function parseAccount(value: unknown): LoginAccount {
  if (typeof value !== "object" || value === null) return {};
  const record = value as Record<string, unknown>;
  const email = shortString(record.email, 320);
  const plan = shortString(record.plan, 64);
  return { ...(email ? { email } : {}), ...(plan ? { plan } : {}) };
}

/** One stdout line → a helper event, or `undefined` for anything unexpected. */
export function parseHelperEvent(line: string): HelperEvent | undefined {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return undefined;
  }
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as Record<string, unknown>;
  switch (record.event) {
    case "pending": {
      const url = shortString(record.verificationUrl, 4096);
      if (!url || !/^https?:\/\//i.test(url)) return undefined;
      const userCode = shortString(record.userCode, 128);
      return {
        event: "pending",
        verificationUrl: url,
        ...(userCode ? { userCode } : {}),
        needsCode: record.needsCode === true,
      };
    }
    case "connected":
      return { event: "connected", account: parseAccount(record.account) };
    case "failed":
      return { event: "failed", error: shortString(record.error, 500) ?? "The sign-in failed" };
    case "disconnected":
      return { event: "disconnected" };
    case "status":
      return {
        event: "status",
        connected: record.connected === true,
        ...(record.account === undefined ? {} : { account: parseAccount(record.account) }),
      };
    default:
      return undefined;
  }
}

interface HelperProcessOptions {
  readonly helper: HelperCommand;
  readonly adapter: LoginAdapterId;
  readonly action: LoginAction;
  readonly layout: WorkspaceLayout;
  readonly env: Record<string, string>;
  readonly killGraceMs: number;
  readonly log: Logger;
  readonly spawner: Spawner;
  readonly killer: Killer;
  readonly onEvent: (event: HelperEvent) => void;
}

/**
 * One run of the sign-in helper. Same isolation and cleanup as `AgentProcess`: own process group,
 * the dir's uid, SIGTERM then SIGKILL to the whole group, and the group is killed when it exits.
 */
class HelperProcess {
  readonly #options: HelperProcessOptions;
  #child: ChildProcess | undefined;
  #terminating = false;
  #exited = false;
  #killTimer: ReturnType<typeof setTimeout> | undefined;
  #stdout = "";
  readonly #stderrTail: string[] = [];
  readonly exited: Promise<{ code: number | null; signal: NodeJS.Signals | null }>;
  #resolveExit!: (info: { code: number | null; signal: NodeJS.Signals | null }) => void;

  constructor(options: HelperProcessOptions) {
    this.#options = options;
    this.exited = new Promise((resolve) => {
      this.#resolveExit = resolve;
    });
  }

  get pid(): number | undefined {
    return this.#child?.pid;
  }

  get stderrTail(): string {
    return this.#stderrTail.join("\n");
  }

  start(): boolean {
    const { helper, adapter, action, layout, env, log } = this.#options;
    const options: SpawnOptions = {
      cwd: layout.cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
      ...(layout.uid === undefined ? {} : { uid: layout.uid, gid: layout.gid ?? layout.uid }),
    };
    let child: ChildProcess;
    try {
      child = this.#options.spawner(helper.command, [...helper.args, adapter, action], options);
    } catch (error) {
      log.error("agent-runner: login helper spawn failed", { error: (error as Error).message });
      this.#markExited(null, null);
      return false;
    }
    this.#child = child;
    log.info("agent-runner: login helper started", { pid: child.pid, uid: layout.uid, action });
    child.stdin?.on("error", () => undefined);
    child.stdout?.on("error", () => undefined);
    child.stdout?.on("data", (chunk: Buffer) => this.#onStdout(chunk));
    child.stderr?.on("data", (chunk: Buffer) => this.#onStderr(chunk));
    child.once("error", (error) => {
      log.error("agent-runner: login helper process error", { error: error.message });
      if (child.pid === undefined) this.#markExited(null, null);
    });
    child.once("exit", (code, signal) => {
      log.info("agent-runner: login helper exited", { code, signal, action });
      if (child.pid !== undefined) this.#options.killer(-child.pid, "SIGKILL");
      this.#markExited(code, signal);
    });
    return true;
  }

  /** Send one JSON line on the helper's stdin. */
  write(message: Record<string, unknown>): boolean {
    const stdin = this.#child?.stdin;
    if (!stdin || this.#exited || stdin.destroyed || stdin.writableEnded) return false;
    stdin.write(`${JSON.stringify(message)}\n`);
    return true;
  }

  /** SIGTERM to the group now, SIGKILL after the grace period. Idempotent. */
  terminate(reason: string): void {
    if (this.#terminating) return;
    this.#terminating = true;
    const child = this.#child;
    if (!child || this.#exited || child.pid === undefined) return;
    this.#options.log.info("agent-runner: stopping login helper", { pid: child.pid, reason });
    this.#options.killer(-child.pid, "SIGTERM");
    this.#killTimer = setTimeout(() => {
      if (!this.#exited && child.pid !== undefined) this.#options.killer(-child.pid, "SIGKILL");
    }, this.#options.killGraceMs);
    this.#killTimer.unref();
  }

  #markExited(code: number | null, signal: NodeJS.Signals | null): void {
    if (this.#exited) return;
    this.#exited = true;
    this.#terminating = true;
    clearTimeout(this.#killTimer);
    this.#resolveExit({ code, signal });
  }

  #onStdout(chunk: Buffer): void {
    this.#stdout += chunk.toString("utf8");
    let newline = this.#stdout.indexOf("\n");
    while (newline !== -1) {
      const line = this.#stdout.slice(0, newline).trim();
      this.#stdout = this.#stdout.slice(newline + 1);
      if (line) {
        const event = parseHelperEvent(line);
        // Never log the line itself: it may carry a verification URL or a device code.
        if (event) this.#options.onEvent(event);
        else this.#options.log.warn("agent-runner: ignored an unexpected login helper line", { bytes: line.length });
      }
      newline = this.#stdout.indexOf("\n");
    }
    if (this.#stdout.length > MAX_LINE_BYTES) {
      this.#stdout = "";
      this.#options.log.warn("agent-runner: login helper line too long");
      this.terminate("output line too long");
    }
  }

  #onStderr(chunk: Buffer): void {
    for (const line of chunk.toString("utf8").split("\n")) {
      if (!line.trim()) continue;
      this.#stderrTail.push(line.slice(0, 500));
      if (this.#stderrTail.length > STDERR_TAIL_LINES) this.#stderrTail.shift();
      this.#options.log.debug("agent-runner: login helper stderr", { line: line.slice(0, 2000) });
    }
  }
}

interface LoginSession {
  readonly id: string;
  readonly key: string;
  readonly userId: string;
  readonly workspaceId: string;
  readonly adapter: LoginAdapterId;
  readonly helper: HelperProcess;
  status: LoginStatus | "starting";
  verificationUrl?: string;
  userCode?: string;
  needsCode: boolean;
  account?: LoginAccount;
  error?: string;
  readonly listeners: Set<() => void>;
  readonly timers: ReturnType<typeof setTimeout>[];
  running: boolean;
}

export interface LoginManagerOptions {
  /** `node <login.mjs>`; `undefined` when the helper is not installed (sign-in is then refused). */
  readonly helper: HelperCommand | undefined;
  /** Prepares the uid and dirs, exactly as for an agent. */
  readonly prepare: (workspaceId: string, userId: string) => Promise<WorkspaceLayout>;
  /** The helper's complete env, built like an agent's. */
  readonly buildEnv: (layout: WorkspaceLayout, ticket: SpawnTicket) => Record<string, string>;
  /** Holds the uid while the helper runs; the returned function releases it (and reaps the uid if idle). */
  readonly leaseUid: (uid: number) => () => void;
  readonly killGraceMs: number;
  readonly log: Logger;
  readonly spawner?: Spawner;
  readonly killer?: Killer;
  readonly timeouts?: Partial<LoginTimeouts>;
}

const keyOf = (ticket: SpawnTicket) => `${ticket.workspaceId}/${ticket.userId}/${ticket.adapter}`;

/**
 * The sign-ins in progress (and recently finished). One active sign-in per (workspace, user,
 * adapter): a new `start` stops the old one.
 */
export class LoginManager {
  readonly #options: LoginManagerOptions;
  readonly #timeouts: LoginTimeouts;
  readonly #byId = new Map<string, LoginSession>();
  readonly #active = new Map<string, LoginSession>();
  readonly #running = new Set<HelperProcess>();

  constructor(options: LoginManagerOptions) {
    this.#options = options;
    this.#timeouts = { ...DEFAULT_LOGIN_TIMEOUTS, ...options.timeouts };
  }

  get available(): boolean {
    return this.#options.helper !== undefined;
  }

  /** Helper processes currently running (they count against the runner's capacity). */
  get running(): number {
    return this.#running.size;
  }

  async start(ticket: SpawnTicket, log: Logger): Promise<{ ok: true; started: LoginStarted } | LoginFailure> {
    const key = keyOf(ticket);
    const previous = this.#active.get(key);
    if (previous) this.#finish(previous, { status: "failed", error: "Another sign-in was started" }, "superseded");

    // Events can only arrive once the helper is running; hold any that beat the session record.
    let session: LoginSession | undefined;
    const early: HelperEvent[] = [];
    const launched = await this.#launch(ticket, "start", log, (event) => {
      if (session) this.#onEvent(session, event);
      else early.push(event);
    });
    if (!launched.ok) return launched;
    session = {
      id: randomUUID(),
      key,
      userId: ticket.userId,
      workspaceId: ticket.workspaceId,
      adapter: ticket.adapter as LoginAdapterId,
      helper: launched.helper,
      status: "starting",
      needsCode: false,
      listeners: new Set(),
      timers: [],
      running: true,
    };
    const current = session;
    this.#byId.set(current.id, current);
    this.#active.set(key, current);
    const lifetime = setTimeout(() => {
      if (current.status === "starting" || current.status === "pending") {
        this.#finish(current, { status: "failed", error: "The sign-in timed out" }, "lifetime exceeded");
      }
    }, this.#timeouts.lifetimeMs);
    lifetime.unref();
    current.timers.push(lifetime);
    void (async () => {
      await launched.helper.exited;
      current.running = false;
      if (current.status === "starting" || current.status === "pending") {
        log.warn("agent-runner: login helper stopped before finishing", { stderr: launched.helper.stderrTail });
        this.#finish(current, { status: "failed", error: "The sign-in helper stopped unexpectedly" });
      }
      this.#notify(current);
    })();
    for (const event of early.splice(0)) this.#onEvent(current, event);

    const settled = await this.#waitFor(current, () => current.status !== "starting", this.#timeouts.startMs);
    if (!settled) {
      this.#finish(current, { status: "failed", error: "The sign-in helper did not answer in time" }, "start timeout");
      return { ok: false, status: 504, error: "The sign-in helper did not answer in time", reason: "timeout" };
    }
    if (current.status === "pending" && current.verificationUrl) {
      return {
        ok: true,
        started: {
          loginId: current.id,
          verificationUrl: current.verificationUrl,
          ...(current.userCode ? { userCode: current.userCode } : {}),
          needsCode: current.needsCode,
        },
      };
    }
    if (current.status === "failed") {
      return { ok: false, status: 502, error: current.error ?? "The sign-in failed", reason: "helper_failed" };
    }
    // Connected without ever asking the user (already signed in): nothing to show, but not an error.
    return { ok: false, status: 409, error: "Already signed in; disconnect first to sign in again" };
  }

  /** The sign-in `loginId`, if it belongs to the ticket's workspace, user and adapter. */
  status(ticket: SpawnTicket, loginId: string): LoginState | undefined {
    const session = this.#owned(ticket, loginId);
    return session ? stateOf(session) : undefined;
  }

  async complete(
    ticket: SpawnTicket,
    loginId: string,
    code: string
  ): Promise<{ ok: true; state: LoginState } | LoginFailure | undefined> {
    const session = this.#owned(ticket, loginId);
    if (!session) return undefined;
    if (session.status !== "pending") return { ok: true, state: stateOf(session) };
    if (!session.needsCode) return { ok: false, status: 400, error: "This sign-in does not take a code" };
    if (!session.helper.write({ code })) return { ok: true, state: stateOf(session) };
    await this.#waitFor(session, () => session.status !== "pending", this.#timeouts.completeMs);
    return { ok: true, state: stateOf(session) };
  }

  /** Stop any sign-in in progress and remove the stored sign-in. */
  async logout(ticket: SpawnTicket, log: Logger): Promise<{ ok: true } | LoginFailure> {
    const active = this.#active.get(keyOf(ticket));
    if (active) this.#finish(active, { status: "failed", error: "Signed out" }, "logout");

    let disconnected = false;
    let failure: string | undefined;
    const launched = await this.#launch(ticket, "logout", log, (event) => {
      if (event.event === "disconnected") disconnected = true;
      if (event.event === "failed") failure = event.error;
    });
    if (!launched.ok) return launched;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const exited = await Promise.race([
      launched.helper.exited.then(() => true),
      new Promise<false>((resolve) => {
        timer = setTimeout(() => resolve(false), this.#timeouts.logoutMs);
      }),
    ]);
    clearTimeout(timer);
    if (!exited) {
      launched.helper.terminate("logout timeout");
      return { ok: false, status: 504, error: "The sign-in helper did not answer in time", reason: "timeout" };
    }
    if (disconnected) return { ok: true };
    log.warn("agent-runner: login helper could not sign out", { stderr: launched.helper.stderrTail });
    return { ok: false, status: 502, error: failure ?? "Could not remove the sign-in", reason: "helper_failed" };
  }

  /** Stop every helper; resolves once they are gone. */
  async close(): Promise<void> {
    for (const session of this.#byId.values()) {
      if (session.status === "starting" || session.status === "pending") {
        this.#finish(session, { status: "failed", error: "The runner is shutting down" }, "runner shutting down");
      }
      for (const timer of session.timers) clearTimeout(timer);
    }
    const helpers = [...this.#running];
    for (const helper of helpers) helper.terminate("runner shutting down");
    await Promise.all(helpers.map((helper) => helper.exited));
    this.#byId.clear();
    this.#active.clear();
  }

  async #launch(
    ticket: SpawnTicket,
    action: LoginAction,
    log: Logger,
    onEvent: (event: HelperEvent) => void
  ): Promise<{ ok: true; helper: HelperProcess } | LoginFailure> {
    const helperCommand = this.#options.helper;
    if (!helperCommand) return { ok: false, status: 503, error: "Sign-in is not available on this runner" };
    const layout = await this.#options.prepare(ticket.workspaceId, ticket.userId);
    const release = layout.uid === undefined ? () => undefined : this.#options.leaseUid(layout.uid);
    const helper = new HelperProcess({
      helper: helperCommand,
      adapter: ticket.adapter as LoginAdapterId,
      action,
      layout,
      env: this.#options.buildEnv(layout, ticket),
      killGraceMs: this.#options.killGraceMs,
      log,
      spawner: this.#options.spawner ?? defaultSpawner,
      killer: this.#options.killer ?? defaultKiller,
      onEvent,
    });
    this.#running.add(helper);
    void (async () => {
      await helper.exited;
      this.#running.delete(helper);
      release();
    })();
    if (!helper.start()) return { ok: false, status: 502, error: "Could not start the sign-in helper" };
    return { ok: true, helper };
  }

  #owned(ticket: SpawnTicket, loginId: string): LoginSession | undefined {
    const session = this.#byId.get(loginId);
    if (!session) return undefined;
    const mine =
      session.userId === ticket.userId &&
      session.workspaceId === ticket.workspaceId &&
      session.adapter === ticket.adapter;
    return mine ? session : undefined;
  }

  #onEvent(session: LoginSession, event: HelperEvent): void {
    if (session.status === "connected" || session.status === "failed") return;
    if (event.event === "pending") {
      if (session.status !== "starting") return;
      session.status = "pending";
      session.verificationUrl = event.verificationUrl;
      if (event.userCode) session.userCode = event.userCode;
      session.needsCode = event.needsCode;
      this.#notify(session);
    } else if (event.event === "connected") {
      this.#finish(session, { status: "connected", account: event.account });
    } else if (event.event === "failed") {
      this.#finish(session, { status: "failed", error: event.error });
    }
  }

  /** Record a final state, keep it readable for a while, and make sure the helper goes away. */
  #finish(session: LoginSession, state: LoginState, stopReason?: string): void {
    if (session.status === "connected" || session.status === "failed") return;
    session.status = state.status;
    if (state.account) session.account = state.account;
    if (state.error) session.error = state.error;
    if (this.#active.get(session.key) === session) this.#active.delete(session.key);
    for (const timer of session.timers.splice(0)) clearTimeout(timer);
    if (stopReason) {
      session.helper.terminate(stopReason);
    } else if (session.running) {
      // The helper said its last word; it has a moment to exit by itself.
      const linger = setTimeout(() => session.helper.terminate("finished"), this.#timeouts.lingerMs);
      linger.unref();
      void session.helper.exited.then(() => clearTimeout(linger));
    }
    const expiry = setTimeout(() => {
      if (this.#byId.get(session.id) === session) this.#byId.delete(session.id);
    }, this.#timeouts.resultTtlMs);
    expiry.unref();
    session.timers.push(expiry);
    this.#notify(session);
  }

  #notify(session: LoginSession): void {
    // A listener may remove itself while we iterate; Set iteration allows that.
    for (const listener of session.listeners) listener();
  }

  /** Resolves true once `done()` holds, false after `timeoutMs`. */
  #waitFor(session: LoginSession, done: () => boolean, timeoutMs: number): Promise<boolean> {
    if (done()) return Promise.resolve(true);
    return new Promise((resolve) => {
      const listener = () => {
        if (!done()) return;
        cleanup();
        resolve(true);
      };
      const timer = setTimeout(() => {
        cleanup();
        resolve(done());
      }, timeoutMs);
      const cleanup = () => {
        clearTimeout(timer);
        session.listeners.delete(listener);
      };
      session.listeners.add(listener);
    });
  }
}

function stateOf(session: LoginSession): LoginState {
  if (session.status === "connected")
    return { status: "connected", ...(session.account ? { account: session.account } : {}) };
  if (session.status === "failed") return { status: "failed", error: session.error ?? "The sign-in failed" };
  return { status: "pending" };
}
