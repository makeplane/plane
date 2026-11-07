/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
  type Router,
} from "express";

import { withMeta, type Logger } from "./logger.ts";
import { PlaneApiError, type AccountMethod, type ConnectionGrant, type PlaneApi } from "./plane-api.ts";
import { RunnerUnavailableError, type LoginRunner, type LoginTarget, type RunnerReply } from "./runner-login.ts";
import { originAllowed, trimTrailingSlashes } from "./origin.ts";

/**
 * Provider account sign-in for Workspace settings → AI providers: `<base>/connections/<provider>/…`.
 * The browser starts a sign-in, the runner's helper (as the user's own uid, in the user's agent
 * HOME) does the provider's flow, and once it reports `connected` the bridge records the personal
 * account credential with the API.
 *
 * Never logged: cookies, tickets, verification URLs, device codes, pasted codes.
 */

/** Provider → the adapter whose CLI holds the sign-in, and the API's method name for it. */
export const CONNECTION_PROVIDERS = {
  openai: { adapter: "codex", method: "chatgpt" },
  google: { adapter: "gemini", method: "google_account" },
} as const satisfies Record<string, { adapter: string; method: AccountMethod }>;

export type ConnectionProvider = keyof typeof CONNECTION_PROVIDERS;

const SLUG = /^[A-Za-z0-9_-]{1,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CODE_LENGTH = 2048;

/** A fixed number of events per key per sliding window. */
export class RateLimiter {
  readonly #max: number;
  readonly #windowMs: number;
  readonly #hits = new Map<string, number[]>();

  constructor(max: number, windowMs: number) {
    this.#max = max;
    this.#windowMs = windowMs;
  }

  /** Records a hit for `key`; `retryAfterMs` is set when the hit is refused. */
  take(key: string, now = Date.now()): { ok: true } | { ok: false; retryAfterMs: number } {
    const since = now - this.#windowMs;
    for (const [other, hits] of this.#hits) {
      const recent = hits.filter((at) => at > since);
      if (recent.length === 0) this.#hits.delete(other);
      else this.#hits.set(other, recent);
    }
    const hits = this.#hits.get(key) ?? [];
    if (hits.length >= this.#max) return { ok: false, retryAfterMs: hits[0]! + this.#windowMs - now };
    hits.push(now);
    this.#hits.set(key, hits);
    return { ok: true };
  }
}

export interface ConnectionsRouterOptions {
  readonly api: PlaneApi;
  readonly runner: LoginRunner;
  readonly log: Logger;
  readonly allowedOrigins: readonly string[];
  readonly startLimit: { readonly max: number; readonly windowMs: number };
}

/** A refusal: the HTTP status and the `{error}` the browser sees. */
class HttpError extends Error {
  readonly status: number;
  readonly headers: Record<string, string>;

  constructor(status: number, message: string, headers: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

type Action = "start" | "status" | "complete" | "disconnect" | "account";

/** Sign-in checks allowed per user per minute (each runs the helper once on the runner). */
const ACCOUNT_CHECKS_PER_MINUTE = 30;

interface Caller {
  readonly provider: ConnectionProvider;
  readonly grant: ConnectionGrant;
  readonly target: LoginTarget;
  readonly log: Logger;
}

const isJson = (req: Request) =>
  (req.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase() === "application/json";

function stringParam(source: unknown, name: string): string {
  if (typeof source !== "object" || source === null) return "";
  const value = (source as Record<string, unknown>)[name];
  return typeof value === "string" ? value : "";
}

function accountOf(value: unknown): { email?: string; plan?: string } | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const email = stringParam(value, "email").slice(0, 320);
  const plan = stringParam(value, "plan").slice(0, 64);
  return { ...(email ? { email } : {}), ...(plan ? { plan } : {}) };
}

/** The runner's `{status, account?, error?}`, or `undefined` when it is not one. */
function loginStateOf(body: Record<string, unknown>) {
  const status = body.status;
  if (status !== "pending" && status !== "connected" && status !== "failed") return undefined;
  const account = status === "connected" ? accountOf(body.account) : undefined;
  const error = status === "failed" ? stringParam(body, "error").slice(0, 500) || "The sign-in failed" : undefined;
  return { status, ...(account ? { account } : {}), ...(error ? { error } : {}) } as const;
}

/** Body-parser failures → 400 `{error}`. */
const badJsonHandler: ErrorRequestHandler = (error: { status?: number }, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.status === 413) return void res.status(400).json({ error: "Request too large" });
  res.status(400).json({ error: "Invalid JSON" });
};

export function connectionsRouter(options: ConnectionsRouterOptions): Router {
  const { api, runner, allowedOrigins } = options;
  const limiter = new RateLimiter(options.startLimit.max, options.startLimit.windowMs);
  const accountLimiter = new RateLimiter(ACCOUNT_CHECKS_PER_MINUTE, 60_000);
  const router = express.Router();

  // CORS (the web app may be on another origin in development) and the Origin check: the
  // endpoints are cookie-authenticated, so a page on another origin must not drive them.
  router.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store");
    const origin = req.headers.origin;
    // A cross-site GET (an image, a link) carries no Origin; the browser's fetch metadata says so.
    const site = req.headers["sec-fetch-site"];
    const crossSiteWithoutOrigin = !origin && (site === "cross-site" || site === "same-site");
    if (crossSiteWithoutOrigin || !originAllowed(req, allowedOrigins)) {
      options.log.warn("agent-bridge: refused cross-origin connections request", { origin });
      return void res.status(403).json({ error: "Origin not allowed" });
    }
    const corsOrigin = origin ? trimTrailingSlashes(origin) : undefined;
    if (corsOrigin && allowedOrigins.includes(corsOrigin)) {
      res.setHeader("Access-Control-Allow-Origin", corsOrigin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.vary("Origin");
    }
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Max-Age", "600");
      return void res.status(204).end();
    }
    next();
  });
  router.use(express.json({ limit: "16kb", type: "application/json" }));

  const route = (method: "get" | "post", action: Action) => {
    router[method](`/:provider/${action}`, (req: Request, res: Response) => {
      void handle(req, res, action);
    });
  };
  route("post", "start");
  route("get", "status");
  route("post", "complete");
  route("post", "disconnect");
  route("get", "account");
  router.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });
  router.use(badJsonHandler);

  async function handle(req: Request, res: Response, action: Action): Promise<void> {
    try {
      const caller = await authenticate(req, action);
      switch (action) {
        case "start":
          return await start(caller, res);
        case "status":
          return await status(caller, req, res);
        case "complete":
          return await complete(caller, req, res);
        case "disconnect":
          return await disconnect(caller, res);
        case "account":
          return await account(caller, res);
      }
    } catch (error) {
      if (res.headersSent) return;
      if (error instanceof HttpError) {
        for (const [name, value] of Object.entries(error.headers)) res.setHeader(name, value);
        return void res.status(error.status).json({ error: error.message });
      }
      options.log.error("agent-bridge: connections request failed", { action, error: (error as Error).message });
      res.status(502).json({ error: "The sign-in service is unavailable" });
    }
  }

  /** Input checks, cookie → user, then the API's membership check. */
  async function authenticate(req: Request, action: Action): Promise<Caller> {
    const provider = req.params.provider ?? "";
    if (!Object.hasOwn(CONNECTION_PROVIDERS, provider)) throw new HttpError(400, "Unknown provider");
    if (req.method === "POST" && !isJson(req)) throw new HttpError(400, "Content-Type must be application/json");
    const workspaceSlug =
      req.method === "GET" ? stringParam(req.query, "workspace") : stringParam(req.body, "workspace");
    if (!SLUG.test(workspaceSlug)) throw new HttpError(400, "workspace is required");

    const cookie = req.headers.cookie;
    if (!cookie) throw new HttpError(401, "Not signed in");
    let userId: string;
    try {
      userId = (await api.currentUser(cookie)).id;
    } catch (error) {
      const code = error instanceof PlaneApiError ? error.status : 0;
      if (code === 401 || code === 403) throw new HttpError(401, "Not signed in");
      options.log.error("agent-bridge: could not authenticate", { status: code, error: (error as Error).message });
      throw new HttpError(502, "Authentication is unavailable");
    }

    const id = provider as ConnectionProvider;
    const log = withMeta(options.log, { userId, workspaceSlug, provider: id, action });
    let grant: ConnectionGrant;
    try {
      grant = await api.authorizeAgentConnection({ userId, workspaceSlug });
    } catch (error) {
      throw apiFailure(error, log, "could not authorize the connection");
    }
    return {
      provider: id,
      grant,
      target: { adapter: CONNECTION_PROVIDERS[id].adapter, userId: grant.user.id, workspaceId: grant.workspace.id },
      log,
    };
  }

  async function start(caller: Caller, res: Response): Promise<void> {
    const allowed = limiter.take(caller.grant.user.id);
    if (!allowed.ok) {
      caller.log.warn("agent-bridge: sign-in start rate limited");
      throw new HttpError(429, "Too many sign-in attempts; try again later", {
        "Retry-After": String(Math.max(1, Math.ceil(allowed.retryAfterMs / 1000))),
      });
    }
    const reply = runnerOk(await callRunner(caller, () => runner.start(caller.target)), caller.log);
    const loginId = stringParam(reply.body, "loginId");
    const verificationUrl = stringParam(reply.body, "verificationUrl");
    const userCode = stringParam(reply.body, "userCode");
    if (!UUID.test(loginId) || !/^https?:\/\//i.test(verificationUrl)) {
      caller.log.error("agent-bridge: unexpected sign-in start answer from the runner");
      throw new HttpError(502, "The sign-in service is unavailable");
    }
    caller.log.info("agent-bridge: sign-in started", { loginId });
    res.json({ loginId, verificationUrl, ...(userCode ? { userCode } : {}), needsCode: reply.body.needsCode === true });
  }

  async function status(caller: Caller, req: Request, res: Response): Promise<void> {
    const loginId = stringParam(req.query, "loginId");
    if (!UUID.test(loginId)) throw new HttpError(400, "loginId is required");
    const reply = runnerOk(await callRunner(caller, () => runner.status(caller.target, loginId)), caller.log);
    res.json(await settle(caller, loginId, reply));
  }

  async function complete(caller: Caller, req: Request, res: Response): Promise<void> {
    const loginId = stringParam(req.body, "loginId");
    const code = stringParam(req.body, "code").trim();
    if (!UUID.test(loginId)) throw new HttpError(400, "loginId is required");
    if (!code || code.length > MAX_CODE_LENGTH) throw new HttpError(400, "code is required");
    const reply = runnerOk(await callRunner(caller, () => runner.complete(caller.target, loginId, code)), caller.log);
    res.json(await settle(caller, loginId, reply));
  }

  async function disconnect(caller: Caller, res: Response): Promise<void> {
    runnerOk(await callRunner(caller, () => runner.logout(caller.target)), caller.log);
    try {
      await api.deleteAgentConnection({
        userId: caller.grant.user.id,
        workspaceSlug: caller.grant.workspace.slug,
        provider: caller.provider,
      });
    } catch (error) {
      throw apiFailure(error, caller.log, "could not remove the connection");
    }
    caller.log.info("agent-bridge: provider account disconnected");
    res.status(204).end();
  }

  /**
   * Whether the member's stored sign-in is still on the runner. A sign-in can vanish there (revoked,
   * expired, a fresh volume) while the API still records it, which would show the agent as usable
   * and fail every chat; such a record is removed. The API only ever removes the account sign-in,
   * never a personal API key.
   */
  async function account(caller: Caller, res: Response): Promise<void> {
    const allowed = accountLimiter.take(caller.grant.user.id);
    if (!allowed.ok) {
      throw new HttpError(429, "Too many sign-in checks; try again later", {
        "Retry-After": String(Math.max(1, Math.ceil(allowed.retryAfterMs / 1000))),
      });
    }
    const reply = runnerOk(await callRunner(caller, () => runner.account(caller.target)), caller.log);
    if (typeof reply.body.connected !== "boolean") {
      caller.log.error("agent-bridge: unexpected sign-in check answer from the runner");
      throw new HttpError(502, "The sign-in service is unavailable");
    }
    if (!reply.body.connected) {
      try {
        await api.deleteAgentConnection({
          userId: caller.grant.user.id,
          workspaceSlug: caller.grant.workspace.slug,
          provider: caller.provider,
        });
      } catch (error) {
        throw apiFailure(error, caller.log, "could not remove the stale connection");
      }
      caller.log.info("agent-bridge: provider account no longer signed in on the runner");
      return void res.json({ connected: false });
    }
    const found = accountOf(reply.body.account);
    res.json({ connected: true, ...(found && Object.keys(found).length > 0 ? { account: found } : {}) });
  }

  /** The runner's login state; on `connected`, record the credential with the API first. */
  async function settle(caller: Caller, loginId: string, reply: RunnerReply) {
    const state = loginStateOf(reply.body);
    if (!state) {
      caller.log.error("agent-bridge: unexpected sign-in status answer from the runner");
      throw new HttpError(502, "The sign-in service is unavailable");
    }
    if (state.status === "connected") {
      try {
        await api.upsertAgentConnection({
          userId: caller.grant.user.id,
          workspaceSlug: caller.grant.workspace.slug,
          provider: caller.provider,
          method: CONNECTION_PROVIDERS[caller.provider].method,
          accountLabel: state.account?.email ?? "",
        });
      } catch (error) {
        throw apiFailure(error, caller.log, "could not record the connection");
      }
      caller.log.info("agent-bridge: provider account connected", { loginId });
    } else if (state.status === "failed") {
      caller.log.info("agent-bridge: sign-in failed", { loginId });
    }
    return state;
  }

  async function callRunner(caller: Caller, call: () => Promise<RunnerReply>): Promise<RunnerReply> {
    try {
      return await call();
    } catch (error) {
      if (!(error instanceof RunnerUnavailableError)) throw error;
      caller.log.error("agent-bridge: agent runner unavailable", { error: error.message });
      throw new HttpError(502, "The agent runner is unavailable");
    }
  }

  return router;
}

/** A 200 from the runner, or the browser-facing refusal for anything else. */
function runnerOk(reply: RunnerReply, log: Logger): RunnerReply {
  if (reply.status === 200) return reply;
  const message = stringParam(reply.body, "error").slice(0, 300);
  if (reply.status === 404) throw new HttpError(404, "Unknown sign-in");
  if (reply.status === 400) throw new HttpError(400, message || "Invalid request");
  if (reply.status === 401) {
    log.error("agent-bridge: the runner rejected the sign-in ticket; check AGENT_RUNNER_SECRET matches");
    throw new HttpError(502, "The sign-in service is misconfigured");
  }
  // The helper's own explanation (a provider refusing the sign-in, a timeout) is worth showing.
  const reason = stringParam(reply.body, "reason");
  if ((reason === "helper_failed" || reason === "timeout" || reply.status === 409) && message) {
    log.warn("agent-bridge: sign-in failed on the runner", { status: reply.status, reason });
    throw new HttpError(502, message);
  }
  log.error("agent-bridge: agent runner refused the sign-in request", { status: reply.status });
  throw new HttpError(502, "The agent runner is unavailable");
}

function apiFailure(error: unknown, log: Logger, what: string): HttpError {
  const status = error instanceof PlaneApiError ? error.status : 0;
  if (error instanceof PlaneApiError && error.isBridgeCredentialError) {
    log.error("agent-bridge: the API rejected AGENT_BRIDGE_SECRET; check it matches the API's", { status });
    return new HttpError(502, "The sign-in service is misconfigured");
  }
  if (status === 400) return new HttpError(400, "Invalid request");
  if (status === 403 || status === 404) return new HttpError(403, "Not a member of this workspace");
  log.error(`agent-bridge: ${what}`, { status, error: (error as Error).message });
  return new HttpError(502, "The Plane API is unavailable");
}
