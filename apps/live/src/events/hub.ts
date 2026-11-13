/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createHmac, randomBytes } from "crypto";
import type { IncomingHttpHeaders } from "http";
import type { BlockList } from "net";
import { z } from "zod";
import { logger } from "@plane/logger";
import { buildTrustedProxies, isPrivateAddress, isTrustedPeer, resolveClientAddress } from "./address";
import type { EventsAuthApi } from "./auth";
import {
  CLOSE_AUTH,
  classifyRolesError,
  extractSessionCookie,
  isSessionGone,
  isValidWorkspaceSlug,
  partitionProjects,
} from "./auth";
import type { EventsConfig } from "./config";
import { EVENTS_CHANNEL_PATTERN, EVENTS_CHANNEL_PREFIX } from "./config";
import { buildAllowlist, CLOSE_ORIGIN, isOriginAllowed } from "./origin";

// Close codes used by the events socket.
export const CLOSE_BAD_MESSAGE = 4400;
export const CLOSE_DISABLED = 4404;
export const CLOSE_DEADLINE = 4408;
export const CLOSE_TOO_LARGE = 4413;
export const CLOSE_LIMIT = 4429;
export const CLOSE_UNAVAILABLE = 1013;
/** Grants could not be revalidated for too many consecutive cycles. */
export const CLOSE_REVALIDATION = CLOSE_UNAVAILABLE;

const OPEN = 1;

/** The subset of a ws WebSocket the hub uses. */
export interface SocketLike {
  readyState: number;
  bufferedAmount: number;
  on(event: string, listener: (...args: any[]) => void): unknown;
  send(data: string): void;
  ping(): void;
  close(code?: number, reason?: string): void;
  terminate(): void;
}

/** The subset of an ioredis subscriber connection the hub uses. */
export interface SubscriberLike {
  on(event: string, listener: (...args: any[]) => void): unknown;
  psubscribe(...patterns: string[]): Promise<unknown>;
  quit(): Promise<unknown>;
}

export type HubDeps = {
  config: EventsConfig;
  auth: EventsAuthApi;
  createSubscriber: () => SubscriberLike | null;
  log?: WarnLog;
  /** Random source in [0, 1) for the revalidation jitter; injectable for tests. */
  random?: () => number;
};

/** Counters since process start. Plain integers only: no ids, users or addresses. */
export type HubStats = {
  sockets: { open: number; authenticated: number; pending: number };
  accepted: number;
  authenticated: number;
  rejected: {
    pendingCap: number;
    addressCap: number;
    authFail: number;
    authTimeout: number;
    /** authenticated sockets closed for sending no subscribe in time */
    noSubscribe: number;
    other: number;
  };
  framesSent: number;
  invalid: { redisDropped: number; clientMessages: number };
  /** userSubscribes: 4429 closes for the per-user subscribe rate */
  rateLimitOverflows: { inboundMessages: number; projectEvents: number; userSubscribes: number };
  /** project roles lookups: answered from the cache, joined an in-flight call, or sent upstream */
  rolesLookups: { cached: number; shared: number; upstream: number };
  /** frames sent as a full refresh, by cause */
  fullRefreshes: { hardOverflow: number; wildcard: number; itemCap: number };
  revalidationCloses: { auth4401: number; unavailable1013: number };
};

export type WarnLog = { warn: (message: string) => unknown };

const INVALID_WARN_INTERVAL_MS = 60_000;
const AUTH_FAIL_WARN_INTERVAL_MS = 60_000;
const MAX_NEGATIVE_CACHE_ENTRIES = 10_000;
const MAX_ROLES_CACHE_ENTRIES = 5000;

export const EVENT_KINDS = [
  "issue",
  "comment",
  "cycle",
  "module",
  "link",
  "attachment",
  "issue_relation",
  "issue_reaction",
  "comment_reaction",
  "intake",
  "state",
  "label",
  // cycle and module definitions (metadata, published as "*"), apart from the membership kinds
  "cycle_definition",
  "module_definition",
  // estimate definitions (an estimate and its points), metadata like the above
  "estimate",
] as const;
export const EVENT_VERBS = ["created", "updated", "deleted", "removed", "archived", "unarchived", "restored"] as const;

const MAX_IDS = 500;
const MAX_SETTLE_TIMERS_PER_PROJECT = 20;
// over projectRatePerSec the window keeps coalescing per work item (a Map insert per
// message, and the frame stays capped at maxItemsPerFrame); only this many times the limit in one second
// collapses it into a full refresh.
const HARD_OVERFLOW_FACTOR = 10;

// `ids` is the legacy name of `issue_ids`, accepted for older publishers during a rolling deploy. The publisher must emit `issue_ids`.
const withIssueIds = (raw: unknown) => {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if (obj.issue_ids === undefined && obj.ids !== undefined) return { ...obj, issue_ids: obj.ids };
  }
  return raw;
};

const redisEventShape = z.object({
  v: z.literal(1),
  project_id: z.string().uuid(),
  issue_ids: z.union([z.array(z.string().uuid()).max(MAX_IDS), z.literal("*")]),
  kind: z.enum(EVENT_KINDS),
  verb: z.enum(EVENT_VERBS),
  actor_id: z.string().uuid().nullish(),
  ts: z.union([z.number(), z.string()]).optional(),
  settle: z.boolean().optional(),
});
export const redisMessageSchema = z.preprocess(withIssueIds, redisEventShape);
export type RedisEvent = z.infer<typeof redisEventShape>;

const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("subscribe"),
    workspace_slug: z.string(),
    project_ids: z.array(z.string().uuid()).max(1000),
  }),
  z.object({ type: z.literal("unsubscribe"), project_ids: z.array(z.string().uuid()).max(1000) }),
  z.object({ type: z.literal("pong") }),
]);

type RejectCounter =
  | "rejectedPendingCap"
  | "rejectedAddressCap"
  | "rejectedAuthFail"
  | "rejectedAuthTimeout"
  | "rejectedOther";

type RolesEntry = { expires: number; roles?: Record<string, number>; flight?: Promise<Record<string, number>> };

type Item = { issue_id: string; kinds: Set<string>; verbs: Set<string>; actor_ids: Set<string> };
type Pending = { items: Map<string, Item>; full: boolean; timer: ReturnType<typeof setTimeout> | null };

type Client = {
  ws: SocketLike;
  cookie: string;
  userId: string | null;
  authed: Promise<boolean>;
  address: string | null;
  pending: boolean; // authentication not finished yet
  gotMessage: boolean;
  authTimer: ReturnType<typeof setTimeout> | null;
  abort: AbortController;
  chain: Promise<void>;
  projects: Map<string, string>; // project id -> workspace slug
  retry: Map<string, string>; // requested while the roles lookup failed transiently: id -> slug
  missedPongs: number;
  inboundStart: number;
  inboundCount: number;
  deadline: ReturnType<typeof setTimeout> | null;
  /** set at authentication, cleared by the first subscribe */
  subscribeDeadline: ReturnType<typeof setTimeout> | null;
  revalTimer: ReturnType<typeof setTimeout> | null;
  revalFailures: number;
  closed: boolean;
};

/**
 * Make ws itself refuse frames above `bytes` (it closes 1009 before buffering the payload).
 * express-ws creates its servers with ws defaults (100 MiB) and is shared with the Hocuspocus
 * endpoint, so the limit is applied to this endpoint's sockets only, on the socket's receiver.
 * If ws internals ever change, the per-message size check in onClientMessage still applies.
 */
export const limitPayload = (ws: unknown, bytes: number): boolean => {
  const receiver = (ws as { _receiver?: { _maxPayload?: number } } | null)?._receiver;
  if (!receiver || typeof receiver._maxPayload !== "number") return false;
  receiver._maxPayload = bytes;
  return true;
};

export class EventsHub {
  private readonly config: EventsConfig;
  private readonly auth: EventsAuthApi;
  private readonly createSubscriber: () => SubscriberLike | null;
  private readonly allowlist: Set<string>;
  private readonly clients = new Set<Client>();
  private readonly byProject = new Map<string, Set<Client>>();
  private readonly pending = new Map<string, Pending>();
  private readonly rate = new Map<string, { start: number; count: number }>();
  private readonly settleTimers = new Set<ReturnType<typeof setTimeout>>();
  private readonly settleState = new Map<string, { count: number; wildcard: ReturnType<typeof setTimeout> | null }>();
  private readonly trusted: BlockList;
  private readonly cacheKey = randomBytes(32);
  private readonly failedCookies = new Map<string, number>(); // keyed digest -> expiry (ms)
  private readonly perAddress = new Map<string, number>();
  // project roles per user and workspace, short-lived, one upstream call at a time
  private readonly rolesCache = new Map<string, RolesEntry>();
  // subscribe messages per user in the current second, across the user's sockets
  private readonly userSubscribeRate = new Map<string, { start: number; count: number }>();
  private readonly proxiesConfigured: boolean;
  private trustedPeerSeen = false;
  private untrustedPeers = 0;
  private warnedProxiesNeverMatch = false;
  private warnedCapInactive = false;
  private pendingCount = 0;
  private authFailures = 0;
  private lastAuthFailWarn = 0;
  private subscriber: SubscriberLike | null = null;
  private seenReady = false;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private readonly random: () => number;
  private stopped = false;
  invalidDropped = 0;
  // cheap monotonic counters for the stats snapshot; they never influence hub behaviour
  private readonly counters = {
    accepted: 0,
    authenticated: 0,
    rejectedPendingCap: 0,
    rejectedAddressCap: 0,
    rejectedAuthFail: 0,
    rejectedAuthTimeout: 0,
    rejectedNoSubscribe: 0,
    rejectedOther: 0,
    framesSent: 0,
    invalidClientMessages: 0,
    overflowInbound: 0,
    overflowProject: 0,
    overflowUserSubscribes: 0,
    rolesCached: 0,
    rolesShared: 0,
    rolesUpstream: 0,
    fullHardOverflow: 0,
    fullWildcard: 0,
    fullItemCap: 0,
    revalAuth: 0,
    revalUnavailable: 0,
  };
  private readonly log: WarnLog;
  private warnedPayloadCap = false;
  private lastInvalidWarn = 0;

  constructor(deps: HubDeps) {
    this.config = deps.config;
    this.auth = deps.auth;
    this.createSubscriber = deps.createSubscriber;
    this.random = deps.random ?? Math.random;
    this.log = deps.log ?? logger;
    this.allowlist = buildAllowlist([...deps.config.allowedOrigins, deps.config.webUrl]);
    const trusted = buildTrustedProxies(deps.config.trustedProxies);
    this.trusted = trusted.list;
    this.proxiesConfigured = trusted.valid > 0;
    if (trusted.invalid > 0) {
      this.log.warn(`LIVE_EVENTS: ignored ${trusted.invalid} unusable trusted proxy entries`);
    }
  }

  get socketCount() {
    return this.clients.size;
  }

  /** Snapshot of the counters since start. Numbers only. */
  stats(): HubStats {
    const c = this.counters;
    return {
      sockets: {
        open: this.clients.size,
        authenticated: this.clients.size - this.pendingCount,
        pending: this.pendingCount,
      },
      accepted: c.accepted,
      authenticated: c.authenticated,
      rejected: {
        pendingCap: c.rejectedPendingCap,
        addressCap: c.rejectedAddressCap,
        authFail: c.rejectedAuthFail,
        authTimeout: c.rejectedAuthTimeout,
        noSubscribe: c.rejectedNoSubscribe,
        other: c.rejectedOther,
      },
      framesSent: c.framesSent,
      invalid: { redisDropped: this.invalidDropped, clientMessages: c.invalidClientMessages },
      rateLimitOverflows: {
        inboundMessages: c.overflowInbound,
        projectEvents: c.overflowProject,
        userSubscribes: c.overflowUserSubscribes,
      },
      rolesLookups: { cached: c.rolesCached, shared: c.rolesShared, upstream: c.rolesUpstream },
      fullRefreshes: { hardOverflow: c.fullHardOverflow, wildcard: c.fullWildcard, itemCap: c.fullItemCap },
      revalidationCloses: { auth4401: c.revalAuth, unavailable1013: c.revalUnavailable },
    };
  }

  /** Start the Redis subscriber and timers. A no-op when the flag is off. */
  async start(): Promise<void> {
    if (!this.config.enabled) return;
    const sub = this.createSubscriber();
    if (!sub) {
      logger.warn("LIVE_EVENTS: no Redis connection available, events hub is idle");
      return;
    }
    this.subscriber = sub;
    sub.on("pmessage", (_pattern: string, channel: string, raw: string) => this.onRedisMessage(channel, raw));
    sub.on("ready", () => {
      if (this.seenReady) this.broadcast({ type: "resync" });
      this.seenReady = true;
    });
    sub.on("error", (error: unknown) => {
      logger.error("LIVE_EVENTS: subscriber error", error instanceof Error ? error.message : "unknown");
    });
    this.pingTimer = setInterval(() => this.heartbeat(), this.config.pingIntervalMs);
    this.pingTimer.unref?.();
    await sub.psubscribe(EVENTS_CHANNEL_PATTERN);
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.settleTimers.forEach((t) => clearTimeout(t));
    this.settleTimers.clear();
    this.settleState.clear();
    this.pending.forEach((p) => p.timer && clearTimeout(p.timer));
    this.pending.clear();
    this.rolesCache.clear();
    this.userSubscribeRate.clear();
    for (const client of this.clients) this.close(client, 1001, "shutdown");
    try {
      await this.subscriber?.quit();
    } catch {
      // ignore: connection already gone
    }
  }

  // ---------------------------------------------------------------- sockets

  handleConnection(
    ws: SocketLike,
    req: { headers: IncomingHttpHeaders; socket?: { remoteAddress?: string } | null }
  ): void {
    const reject = (code: number, reason: string, counter: RejectCounter = "rejectedOther") => {
      this.counters[counter]++;
      try {
        ws.close(code, reason);
      } catch {
        // ignore
      }
    };
    if (!this.config.enabled) return reject(CLOSE_DISABLED, "live events disabled");
    if (!limitPayload(ws, this.config.maxMessageBytes) && !this.warnedPayloadCap) {
      this.warnedPayloadCap = true;
      this.log.warn("LIVE_EVENTS: could not apply the ws payload cap, relying on the post-receive size check");
    }
    if (this.stopped || !this.subscriber) return reject(CLOSE_UNAVAILABLE, "unavailable");
    const headers = req.headers;
    if (
      !isOriginAllowed(
        {
          origin: headers.origin,
          host: headers.host,
          forwardedHost: headers["x-forwarded-host"],
          forwardedProto: headers["x-forwarded-proto"],
        },
        this.allowlist,
        this.config.originHostFallback
      )
    ) {
      return reject(CLOSE_ORIGIN, "origin not allowed");
    }
    const cookie = extractSessionCookie(headers.cookie);
    if (!cookie) return reject(CLOSE_AUTH, "unauthenticated", "rejectedAuthFail");
    // a cookie that was just refused is refused again without any upstream work
    if (this.isCookieFailed(cookie)) return reject(CLOSE_AUTH, "unauthenticated", "rejectedAuthFail");
    this.noteProxyMatch(req.socket?.remoteAddress);
    const address = resolveClientAddress(req.socket?.remoteAddress, headers["x-forwarded-for"], this.trusted);
    // Without a trusted proxy list a private direct peer is most likely the reverse proxy itself, so
    // every user would share one address: the per-address cap is skipped for it (with a warning).
    const capApplies = address !== null && !this.sharedProxyPeer(address);
    if (address && capApplies && (this.perAddress.get(address) ?? 0) >= this.config.maxSocketsPerAddress) {
      return reject(CLOSE_LIMIT, "too many connections", "rejectedAddressCap");
    }
    if (this.pendingCount >= this.config.maxPendingSockets) {
      return reject(CLOSE_LIMIT, "too many connections", "rejectedPendingCap");
    }
    // sockets that have not authenticated yet do not use up the budget of authenticated users
    if (this.clients.size - this.pendingCount >= this.config.maxSockets) {
      return reject(CLOSE_LIMIT, "too many connections");
    }

    const client: Client = {
      ws,
      cookie,
      userId: null,
      authed: Promise.resolve(false),
      address,
      pending: true,
      gotMessage: false,
      authTimer: null,
      abort: new AbortController(),
      chain: Promise.resolve(),
      projects: new Map(),
      retry: new Map(),
      missedPongs: 0,
      inboundStart: Date.now(),
      inboundCount: 0,
      deadline: null,
      subscribeDeadline: null,
      revalTimer: null,
      revalFailures: 0,
      closed: false,
    };
    this.clients.add(client);
    this.counters.accepted++;
    this.pendingCount++;
    if (address && capApplies) this.perAddress.set(address, (this.perAddress.get(address) ?? 0) + 1);
    else client.address = null;
    client.authTimer = setTimeout(() => {
      client.authTimer = null;
      client.abort.abort();
      this.counters.rejectedAuthTimeout++;
      this.noteAuthFailure();
      this.close(client, CLOSE_DEADLINE, "authentication timed out");
    }, this.config.authTimeoutMs);
    client.deadline = setTimeout(
      () => this.close(client, CLOSE_DEADLINE, "no message received"),
      this.config.firstMessageMs
    );

    client.authed = this.auth
      .currentUser(cookie, client.abort.signal)
      .then((user) => {
        if (client.closed) return false;
        client.userId = user.id;
        const sameUser = [...this.clients].filter((c) => c !== client && c.userId === user.id).length;
        if (sameUser >= this.config.maxSocketsPerUser) {
          this.counters.rejectedOther++;
          this.close(client, CLOSE_LIMIT, "too many connections for user");
          return false;
        }
        if (this.clients.size - this.pendingCount >= this.config.maxSockets) {
          this.counters.rejectedOther++;
          this.close(client, CLOSE_LIMIT, "too many connections");
          return false;
        }
        this.counters.authenticated++;
        this.markAuthenticated(client);
        this.scheduleRevalidation(client, true);
        return true;
      })
      .catch((error) => {
        if (client.closed) return false;
        // only a definitive answer is remembered; a timeout or upstream error is not
        if ((error as { statusCode?: number } | null)?.statusCode === 401) this.rememberFailedCookie(cookie);
        this.counters.rejectedAuthFail++;
        this.noteAuthFailure();
        this.close(client, CLOSE_AUTH, "unauthenticated");
        return false;
      });

    ws.on("message", (data: unknown) => this.onClientMessage(client, data));
    ws.on("pong", () => {
      client.missedPongs = 0;
    });
    ws.on("close", () => this.release(client));
    ws.on("error", () => this.close(client, 1011, "socket error"));
  }

  private onClientMessage(client: Client, data: unknown): void {
    if (client.closed) return;
    // The first-message deadline keeps running until authentication has succeeded.
    client.gotMessage = true;
    if (!client.pending) this.clearDeadline(client);
    const now = Date.now();
    if (now - client.inboundStart >= 1000) {
      client.inboundStart = now;
      client.inboundCount = 0;
    }
    if (++client.inboundCount > this.config.maxInboundPerSec) {
      this.counters.overflowInbound++;
      return this.close(client, CLOSE_LIMIT, "message rate exceeded");
    }
    const size = Array.isArray(data)
      ? data.reduce((n: number, b: Buffer) => n + b.length, 0)
      : ((data as { byteLength?: number })?.byteLength ?? String(data).length);
    if (size > this.config.maxMessageBytes) return this.close(client, CLOSE_TOO_LARGE, "message too large");

    const text = Array.isArray(data) ? Buffer.concat(data as Buffer[]).toString("utf8") : String(data);
    let message: z.infer<typeof clientMessageSchema>;
    try {
      message = clientMessageSchema.parse(JSON.parse(text));
    } catch {
      this.counters.invalidClientMessages++;
      return this.close(client, CLOSE_BAD_MESSAGE, "invalid message");
    }
    client.chain = client.chain
      .then(() => this.processClientMessage(client, message))
      .catch(() => this.close(client, 1011, "internal error"));
  }

  private async processClientMessage(client: Client, message: z.infer<typeof clientMessageSchema>) {
    if (!(await client.authed) || client.closed) return;
    if (message.type === "pong") {
      client.missedPongs = 0;
      return;
    }
    if (message.type === "unsubscribe") {
      for (const id of message.project_ids) {
        this.removeProject(client, id);
        client.retry.delete(id);
      }
      this.send(client, { type: "unsubscribed", project_ids: message.project_ids });
      return;
    }
    if (!isValidWorkspaceSlug(message.workspace_slug)) {
      return this.close(client, CLOSE_BAD_MESSAGE, "invalid workspace");
    }
    // the socket has subscribed; and one user's sockets together get a bounded subscribe rate,
    // because every subscribe may cost a roles lookup upstream
    if (client.subscribeDeadline) clearTimeout(client.subscribeDeadline);
    client.subscribeDeadline = null;
    if (!this.allowUserSubscribe(client)) {
      this.counters.overflowUserSubscribes++;
      return this.close(client, CLOSE_LIMIT, "subscribe rate exceeded");
    }
    const requested = [...new Set(message.project_ids)];
    // a fresh subscribe re-evaluates anything that was waiting for a retry
    for (const id of requested) client.retry.delete(id);
    const total = new Set([...client.projects.keys(), ...client.retry.keys(), ...requested]).size;
    if (total > this.config.maxProjectsPerSocket) return this.close(client, CLOSE_LIMIT, "too many projects");

    let roles: Record<string, number>;
    try {
      roles = await this.projectRoles(client, message.workspace_slug);
    } catch (error) {
      const failure = classifyRolesError(error);
      if (failure === "session") return this.close(client, CLOSE_AUTH, "session ended");
      if (failure === "denied") {
        // no access to this workspace
        this.send(client, { type: "subscribed", project_ids: [], denied: requested });
        return;
      }
      // membership could not be established: grant nothing yet, keep the request pending and
      // retry at the next revalidation tick or the next subscribe. Not reported as denied.
      for (const id of requested) client.retry.set(id, message.workspace_slug);
      this.send(client, { type: "subscribed", project_ids: [], denied: [] });
      return;
    }
    if (client.closed) return;
    const { granted, denied } = partitionProjects(requested, roles);
    for (const id of granted) this.addProject(client, id, message.workspace_slug);
    this.send(client, { type: "subscribed", project_ids: granted, denied });
  }

  private addProject(client: Client, projectId: string, slug: string) {
    client.projects.set(projectId, slug);
    let set = this.byProject.get(projectId);
    if (!set) this.byProject.set(projectId, (set = new Set()));
    set.add(client);
  }

  private removeProject(client: Client, projectId: string) {
    client.projects.delete(projectId);
    const set = this.byProject.get(projectId);
    if (!set) return;
    set.delete(client);
    if (set.size === 0) {
      this.byProject.delete(projectId);
      const p = this.pending.get(projectId);
      if (p?.timer) clearTimeout(p.timer);
      this.pending.delete(projectId);
    }
  }

  // ------------------------------------------------------ roles cache

  /**
   * Project roles of the client's user in a workspace. A successful answer is cached per user and
   * workspace for rolesCacheMs, and concurrent lookups for the same key share one upstream call. A
   * caller that joined another socket's call and saw it fail asks again with its own cookie, so one
   * dead session cannot close a sibling socket. Failures are never cached.
   */
  private async projectRoles(client: Client, slug: string): Promise<Record<string, number>> {
    if (!client.userId || this.config.rolesCacheMs <= 0) {
      this.counters.rolesUpstream++;
      return this.auth.projectRoles(client.cookie, slug);
    }
    const key = `${client.userId}\n${slug}`;
    const now = Date.now();
    const entry = this.rolesCache.get(key);
    if (entry?.roles && entry.expires > now) {
      this.counters.rolesCached++;
      return entry.roles;
    }
    if (entry?.flight) {
      this.counters.rolesShared++;
      try {
        return await entry.flight;
      } catch {
        this.counters.rolesUpstream++;
        return this.auth.projectRoles(client.cookie, slug);
      }
    }
    this.counters.rolesUpstream++;
    this.pruneRolesCache(now);
    const flight = this.auth.projectRoles(client.cookie, slug);
    const pending: RolesEntry = { expires: 0, flight };
    this.rolesCache.set(key, pending);
    try {
      const roles = await flight;
      if (this.rolesCache.get(key) === pending) {
        this.rolesCache.set(key, { expires: Date.now() + this.config.rolesCacheMs, roles });
      }
      return roles;
    } catch (error) {
      if (this.rolesCache.get(key) === pending) this.rolesCache.delete(key);
      throw error;
    }
  }

  private pruneRolesCache(now: number) {
    if (this.rolesCache.size < MAX_ROLES_CACHE_ENTRIES) return;
    for (const [key, entry] of this.rolesCache) if (!entry.flight && entry.expires <= now) this.rolesCache.delete(key);
    for (const key of this.rolesCache.keys()) {
      if (this.rolesCache.size < MAX_ROLES_CACHE_ENTRIES) break;
      this.rolesCache.delete(key);
    }
  }

  private allowUserSubscribe(client: Client): boolean {
    if (!client.userId) return true;
    const now = Date.now();
    let rate = this.userSubscribeRate.get(client.userId);
    if (!rate || now - rate.start >= 1000) this.userSubscribeRate.set(client.userId, (rate = { start: now, count: 0 }));
    return ++rate.count <= this.config.maxUserSubscribesPerSec;
  }

  /** One warning when LIVE_EVENTS_TRUSTED_PROXIES is set but no connection ever comes from one of them. */
  private noteProxyMatch(peer: string | undefined) {
    if (!this.proxiesConfigured || this.trustedPeerSeen || this.warnedProxiesNeverMatch) return;
    if (isTrustedPeer(peer, this.trusted)) {
      this.trustedPeerSeen = true;
      return;
    }
    if (++this.untrustedPeers < this.config.trustedProxyWarnAfter) return;
    this.warnedProxiesNeverMatch = true;
    this.log.warn(
      `LIVE_EVENTS: none of the first ${this.untrustedPeers} connections came from LIVE_EVENTS_TRUSTED_PROXIES; X-Forwarded-For is not used, check the list`
    );
  }

  private sharedProxyPeer(address: string): boolean {
    if (this.proxiesConfigured || !isPrivateAddress(address)) return false;
    if (!this.warnedCapInactive) {
      this.warnedCapInactive = true;
      this.log.warn(
        "LIVE_EVENTS: the per-address socket cap is inactive for private peer addresses until LIVE_EVENTS_TRUSTED_PROXIES is set"
      );
    }
    return true;
  }

  private clearDeadline(client: Client) {
    if (client.deadline) clearTimeout(client.deadline);
    client.deadline = null;
  }

  private markAuthenticated(client: Client) {
    if (!client.pending) return;
    client.pending = false;
    this.pendingCount--;
    if (client.authTimer) clearTimeout(client.authTimer);
    client.authTimer = null;
    if (client.gotMessage) this.clearDeadline(client);
    // an authenticated socket that never subscribes only holds a slot
    client.subscribeDeadline = setTimeout(() => {
      client.subscribeDeadline = null;
      if (client.closed) return;
      this.counters.rejectedNoSubscribe++;
      this.close(client, CLOSE_DEADLINE, "no subscription");
    }, this.config.subscribeDeadlineMs);
    client.subscribeDeadline.unref?.();
  }

  private release(client: Client) {
    if (client.closed) return;
    client.closed = true;
    if (client.deadline) clearTimeout(client.deadline);
    if (client.subscribeDeadline) clearTimeout(client.subscribeDeadline);
    if (client.authTimer) clearTimeout(client.authTimer);
    if (client.revalTimer) clearTimeout(client.revalTimer);
    if (client.pending) {
      this.pendingCount--;
    }
    client.abort.abort(); // stop an unfinished session lookup or revalidation call
    client.pending = false;
    if (client.address) {
      const left = (this.perAddress.get(client.address) ?? 1) - 1;
      if (left <= 0) this.perAddress.delete(client.address);
      else this.perAddress.set(client.address, left);
    }
    for (const id of client.projects.keys()) this.removeProject(client, id);
    client.retry.clear();
    this.clients.delete(client);
  }

  private close(client: Client, code: number, reason: string) {
    this.release(client);
    try {
      client.ws.close(code, reason);
    } catch {
      // ignore
    }
  }

  private send(client: Client, frame: unknown): boolean {
    if (client.closed || client.ws.readyState !== OPEN) return false;
    if (client.ws.bufferedAmount > this.config.maxBufferedBytes) {
      this.close(client, CLOSE_LIMIT, "client too slow");
      return false;
    }
    try {
      client.ws.send(JSON.stringify(frame));
      this.counters.framesSent++;
      return true;
    } catch {
      this.close(client, 1011, "send failed");
      return false;
    }
  }

  private broadcast(frame: unknown) {
    for (const client of this.clients) this.send(client, frame);
  }

  // -------------------------------------------------------------- heartbeat

  private heartbeat() {
    const now = Date.now();
    for (const [id, r] of this.rate) if (now - r.start >= 1000) this.rate.delete(id);
    for (const [id, r] of this.userSubscribeRate) if (now - r.start >= 1000) this.userSubscribeRate.delete(id);
    for (const client of this.clients) {
      if (client.missedPongs >= this.config.maxMissedPongs) {
        this.release(client);
        try {
          client.ws.terminate();
        } catch {
          // ignore
        }
        continue;
      }
      client.missedPongs++;
      try {
        client.ws.ping();
      } catch {
        // ignore: the next tick terminates it
      }
      this.send(client, { type: "ping" });
    }
  }

  // ------------------------------------------------------------ revalidation

  /** Next revalidation delay: the configured interval, spread by +/- revalidateJitter. */
  nextRevalidateDelay(): number {
    const { revalidateMs, revalidateJitter } = this.config;
    return Math.round(revalidateMs * (1 + (this.random() * 2 - 1) * revalidateJitter));
  }

  /**
   * the first revalidation of a socket is spread uniformly over the whole interval (at
   * least 1 s): after a restart every client reconnects at once, and +/- jitter alone would keep those
   * rechecks bunched together for many cycles.
   */
  firstRevalidateDelay(): number {
    return Math.max(1000, Math.round(this.config.revalidateMs * this.random()));
  }

  // Each socket revalidates on its own jittered timer so the upstream calls are spread out.
  private scheduleRevalidation(client: Client, first = false) {
    if (client.closed || this.stopped) return;
    client.revalTimer = setTimeout(
      () => {
        client.revalTimer = null;
        void this.runRevalidation(client);
      },
      first ? this.firstRevalidateDelay() : this.nextRevalidateDelay()
    );
    client.revalTimer.unref?.();
  }

  private async runRevalidation(client: Client) {
    let outcome: "ok" | "transient";
    try {
      outcome = await this.revalidate(client);
    } catch {
      outcome = "transient";
    }
    if (client.closed) return;
    if (outcome === "ok") {
      client.revalFailures = 0;
    } else if (++client.revalFailures >= this.config.revalidateMaxFailures) {
      this.counters.revalUnavailable++;
      this.close(client, CLOSE_REVALIDATION, "revalidation unavailable");
      return;
    }
    this.scheduleRevalidation(client);
  }

  private async revalidate(client: Client): Promise<"ok" | "transient"> {
    if (client.closed || !client.userId) return "ok";
    try {
      const user = await this.auth.currentUser(client.cookie, client.abort.signal);
      if (user.id !== client.userId) {
        if (!client.closed) this.counters.revalAuth++;
        this.close(client, CLOSE_AUTH, "session changed");
        return "ok";
      }
    } catch (error) {
      // a transient failure is counted by the caller; the socket closes after repeated ones
      if (isSessionGone(error)) {
        if (!client.closed) this.counters.revalAuth++;
        this.close(client, CLOSE_AUTH, "session ended");
      }
      return isSessionGone(error) ? "ok" : "transient";
    }
    let outcome: "ok" | "transient" = "ok";
    const slugs = new Set([...client.projects.values(), ...client.retry.values()]);
    for (const slug of slugs) {
      if (client.closed) return "ok";
      let roles: Record<string, number>;
      try {
        // oxlint-disable-next-line no-await-in-loop
        roles = await this.projectRoles(client, slug);
      } catch (error) {
        const failure = classifyRolesError(error);
        if (failure === "session") {
          if (!client.closed) this.counters.revalAuth++;
          this.close(client, CLOSE_AUTH, "session ended");
          return "ok";
        }
        if (failure === "transient") {
          outcome = "transient";
          continue;
        }
        roles = {}; // no access to this workspace
      }
      if (client.closed) return "ok";
      const mine = [...client.projects].filter(([, s]) => s === slug).map(([id]) => id);
      const { denied } = partitionProjects(mine, roles);
      if (denied.length > 0) {
        for (const id of denied) this.removeProject(client, id);
        this.send(client, { type: "revoked", project_ids: denied });
      }
      // retry grants that were pending after a transient failure
      const waiting = [...client.retry].filter(([, s]) => s === slug).map(([id]) => id);
      if (waiting.length > 0) {
        for (const id of waiting) client.retry.delete(id);
        const result = partitionProjects(waiting, roles);
        for (const id of result.granted) this.addProject(client, id, slug);
        this.send(client, { type: "subscribed", project_ids: result.granted, denied: result.denied });
      }
    }
    return outcome;
  }

  // ------------------------------------------------------------------ redis

  private onRedisMessage(channel: string, raw: string) {
    try {
      const parsed = redisMessageSchema.safeParse(JSON.parse(raw));
      const channelProject = channel.startsWith(EVENTS_CHANNEL_PREFIX)
        ? channel.slice(EVENTS_CHANNEL_PREFIX.length)
        : "";
      if (!parsed.success || parsed.data.project_id !== channelProject) {
        this.noteInvalid();
        return;
      }
      this.ingest(parsed.data, false);
    } catch {
      this.noteInvalid();
    }
  }

  // ------------------------------------------------------ failed-cookie cache

  // Keyed digest of the cookie, never the cookie itself; the key is random per process.
  private digest(cookie: string): string {
    return createHmac("sha256", this.cacheKey).update(cookie).digest("hex");
  }

  private isCookieFailed(cookie: string): boolean {
    if (this.config.authFailCacheMs <= 0 || this.failedCookies.size === 0) return false;
    const key = this.digest(cookie);
    const expiry = this.failedCookies.get(key);
    if (expiry === undefined) return false;
    if (expiry > Date.now()) return true;
    this.failedCookies.delete(key);
    return false;
  }

  private rememberFailedCookie(cookie: string) {
    if (this.config.authFailCacheMs <= 0) return;
    const now = Date.now();
    if (this.failedCookies.size >= MAX_NEGATIVE_CACHE_ENTRIES) {
      for (const [key, expiry] of this.failedCookies) if (expiry <= now) this.failedCookies.delete(key);
      // still full: drop the oldest entries (Map keeps insertion order)
      for (const key of this.failedCookies.keys()) {
        if (this.failedCookies.size < MAX_NEGATIVE_CACHE_ENTRIES) break;
        this.failedCookies.delete(key);
      }
    }
    this.failedCookies.set(this.digest(cookie), now + this.config.authFailCacheMs);
  }

  private noteAuthFailure() {
    this.authFailures++;
    const now = Date.now();
    if (now - this.lastAuthFailWarn < AUTH_FAIL_WARN_INTERVAL_MS) return;
    this.lastAuthFailWarn = now;
    this.log.warn(`LIVE_EVENTS: authentication failures, running count ${this.authFailures}`);
  }

  private noteInvalid() {
    this.invalidDropped++;
    const now = Date.now();
    if (now - this.lastInvalidWarn < INVALID_WARN_INTERVAL_MS) return;
    this.lastInvalidWarn = now;
    this.log.warn(`LIVE_EVENTS: dropped invalid Redis messages, running count ${this.invalidDropped}`);
  }

  private ingest(event: RedisEvent, fromSettle: boolean) {
    const projectId = event.project_id;
    if (!this.byProject.has(projectId)) return;

    // settle re-emits are internal: they neither consume nor trip the inbound limit
    // one Redis message is published per issue_activity task when the worker runs it, so a
    // worker draining a backlog (or one request that fans out to many tasks) easily passes the soft limit while
    // the API sees only a few writes per second. Over the soft limit the messages are still merged per work
    // item; only the hard limit (or the frame's item cap) turns the window into a full refresh.
    let hardOverflow = false;
    if (!fromSettle) {
      const now = Date.now();
      let rate = this.rate.get(projectId);
      if (!rate || now - rate.start >= 1000) this.rate.set(projectId, (rate = { start: now, count: 0 }));
      const count = ++rate.count;
      if (count > this.config.projectRatePerSec) this.counters.overflowProject++;
      hardOverflow = count > this.config.projectRatePerSec * HARD_OVERFLOW_FACTOR;
    }

    let pending = this.pending.get(projectId);
    if (!pending) this.pending.set(projectId, (pending = { items: new Map(), full: false, timer: null }));

    // Far over the limit, or a project-wide event: nothing is dropped, the whole window
    // collapses into one full refresh.
    if (hardOverflow || event.issue_ids === "*") {
      if (!pending.full) {
        if (hardOverflow) this.counters.fullHardOverflow++;
        else this.counters.fullWildcard++;
      }
      this.markFull(pending);
    } else if (!pending.full) {
      for (const id of event.issue_ids) {
        let item = pending.items.get(id);
        if (!item)
          pending.items.set(id, (item = { issue_id: id, kinds: new Set(), verbs: new Set(), actor_ids: new Set() }));
        item.kinds.add(event.kind);
        item.verbs.add(event.verb);
        if (event.actor_id) item.actor_ids.add(event.actor_id);
      }
      if (pending.items.size > this.config.maxItemsPerFrame) {
        this.counters.fullItemCap++;
        this.markFull(pending);
      }
    }
    if (!pending.timer) pending.timer = setTimeout(() => this.flush(projectId), this.config.coalesceMs);

    if (event.settle && !fromSettle) this.scheduleSettle(event);
  }

  // At most MAX_SETTLE_TIMERS_PER_PROJECT individual re-emits are pending per project. Beyond
  // that a single project-wide re-emit is (re)started, so timers stay bounded under a burst.
  private scheduleSettle(event: RedisEvent) {
    const projectId = event.project_id;
    let state = this.settleState.get(projectId);
    if (!state) this.settleState.set(projectId, (state = { count: 0, wildcard: null }));
    const st = state;
    const arm = (fire: () => void) => {
      const timer = setTimeout(() => {
        this.settleTimers.delete(timer);
        fire();
        if (st.count === 0 && !st.wildcard) this.settleState.delete(projectId);
      }, this.config.settleMs);
      this.settleTimers.add(timer);
      return timer;
    };
    if (st.count < MAX_SETTLE_TIMERS_PER_PROJECT) {
      st.count++;
      arm(() => {
        st.count--;
        this.ingest({ ...event, settle: false }, true);
      });
      return;
    }
    if (st.wildcard) {
      clearTimeout(st.wildcard);
      this.settleTimers.delete(st.wildcard);
    }
    st.wildcard = arm(() => {
      st.wildcard = null;
      this.ingest({ ...event, issue_ids: "*", settle: false }, true);
    });
  }

  private markFull(pending: Pending) {
    pending.full = true;
    pending.items.clear();
  }

  private flush(projectId: string) {
    const pending = this.pending.get(projectId);
    this.pending.delete(projectId);
    const clients = this.byProject.get(projectId);
    if (!pending || !clients || clients.size === 0) return;
    const frame: Record<string, unknown> = {
      type: "events",
      project_id: projectId,
      items: pending.full
        ? []
        : [...pending.items.values()].map((i) => ({
            issue_id: i.issue_id,
            kinds: [...i.kinds],
            verbs: [...i.verbs],
            actor_ids: [...i.actor_ids],
          })),
    };
    if (pending.full) frame.full_refresh = true;
    for (const client of clients) this.send(client, frame);
  }
}
