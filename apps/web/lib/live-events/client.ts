/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { LIVE_BASE_PATH, LIVE_BASE_URL } from "@plane/constants";

/**
 * Frame contract, mirrored from the live hub (apps/live/src/events/hub.ts). Ids only, no content on the wire.
 *
 * client -> server
 *  - { type: "subscribe", workspace_slug, project_ids }
 *  - { type: "unsubscribe", project_ids }
 *  - { type: "pong" }                       answer to a server ping
 * server -> client
 *  - { type: "ping" }
 *  - { type: "events", project_id, items: [{ issue_id, kinds, verbs, actor_ids }], full_refresh? }
 *  - { type: "resync" }                     the hub lost its Redis subscription, every project must resync
 *  - { type: "subscribed", project_ids, denied }
 *  - { type: "unsubscribed", project_ids }
 *  - { type: "revoked", project_ids }       access to these projects was lost
 */
export type TLiveKind =
  | "issue"
  | "comment"
  | "cycle"
  | "module"
  | "link"
  | "attachment"
  | "issue_relation"
  | "issue_reaction"
  | "comment_reaction"
  | "intake"
  // project metadata (arrives as a full refresh)
  | "state"
  | "label"
  | "cycle_definition"
  | "module_definition"
  | "estimate";
export type TLiveVerb = "created" | "updated" | "deleted" | "removed" | "archived" | "unarchived" | "restored";

export type TLiveItem = { issue_id: string; kinds: string[]; verbs: string[]; actor_ids: string[] };

export type TLiveEventsFrame = { type: "events"; project_id: string; items: TLiveItem[]; full_refresh?: boolean };
/** emitted locally: the socket was re-established or the hub resynced, so anything may have been missed */
export type TLiveResyncFrame = { type: "resync"; project_id: string };
/** emitted locally: access to the project was lost, the project is no longer subscribed */
export type TLiveRevokedFrame = { type: "revoked"; project_id: string };

export type TLiveEvent = TLiveEventsFrame | TLiveResyncFrame | TLiveRevokedFrame;
export type TLiveListener = (event: TLiveEvent) => void;

/**
 * the connection state of the shared socket, for the status indicator.
 *  - idle: nothing is subscribed in this tab (no socket wanted)
 *  - connecting: the first connection of this session is being opened
 *  - connected: the socket is open
 *  - reconnecting: the socket was open before and is being re-established (backoff, or a closed hidden tab)
 *  - offline: not trying: the browser is offline, the session needs a sign-in (4401, retried on activity),
 *    or the hub refused this client (4400/4403/4404/4413, until the next page load)
 */
export type TLiveConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "offline";
export type TLiveOfflineReason = "network" | "unauthenticated" | "stopped";
export type TLiveConnectionStatus = { state: TLiveConnectionState; offlineReason?: TLiveOfflineReason };
export type TLiveConnectionListener = (status: TLiveConnectionStatus) => void;

type TServerFrame =
  | TLiveEventsFrame
  | { type: "ping" }
  | { type: "resync" }
  | { type: "subscribed"; project_ids: string[]; denied: string[] }
  | { type: "unsubscribed" }
  | { type: "revoked"; project_ids: string[] };

export const LIVE_CLOSE_BAD_MESSAGE = 4400;
export const LIVE_CLOSE_UNAUTHENTICATED = 4401;
export const LIVE_CLOSE_FORBIDDEN = 4403;
export const LIVE_CLOSE_NOT_FOUND = 4404;
export const LIVE_CLOSE_TOO_LARGE = 4413;
export const LIVE_CLOSE_RATE_LIMITED = 4429;
export const LIVE_CLOSE_UNAVAILABLE = 1013;

export const BACKOFF_MIN_MS = 1000;
export const BACKOFF_MAX_MS = 30_000;
/** Lower bound of a delay: half of BACKOFF_MIN_MS, so the first retry is jittered as well. */
export const BACKOFF_FLOOR_MS = BACKOFF_MIN_MS / 2;
/**
 * A disconnect that is over within this window is treated as a blip and does not refetch. The hub has no
 * replay, so events published during a blip are NOT recovered and a card can stay stale until its next
 * change; the window trades that against a refetch on every flaky-network hiccup. A longer gap triggers
 * exactly one resync. The same window decides when a connection has proved stable (see markStable) and
 * how long a hub `resync` frame right after the reopen resync is considered a duplicate.
 */
export const SETTLE_WINDOW_MS = 5000;
export const WATCHDOG_MS = 60_000;
export const HIDDEN_CLOSE_MS = 5 * 60_000;
export const HIDDEN_BUFFER_CAP = 200;

/**
 * Exponential backoff with jitter (50%-100% of the step), from BACKOFF_FLOOR_MS up to BACKOFF_MAX_MS.
 * The step doubles from BACKOFF_MIN_MS per attempt and is capped at BACKOFF_MAX_MS.
 * `random` is injectable so the function stays pure.
 */
export const getBackoffDelay = (attempt: number, random: number = Math.random()): number => {
  const step = Math.min(BACKOFF_MAX_MS, BACKOFF_MIN_MS * 2 ** Math.max(0, attempt));
  return Math.max(BACKOFF_FLOOR_MS, Math.round(step * (0.5 + 0.5 * random)));
};

/** Reconnect policy for a close code. */
export type TCloseDecision = "retry" | "retry-max" | "pause" | "stop";
export const decideOnClose = (code: number): TCloseDecision => {
  switch (code) {
    case LIVE_CLOSE_UNAUTHENTICATED:
      return "pause";
    // 4403 origin not allowed, 4404 live events disabled: stopped until the next full page load
    case LIVE_CLOSE_FORBIDDEN:
    case LIVE_CLOSE_NOT_FOUND:
    // 4400 and 4413 mean the server rejected what this client sent; retrying would only repeat it
    case LIVE_CLOSE_BAD_MESSAGE:
    case LIVE_CLOSE_TOO_LARGE:
      return "stop";
    case LIVE_CLOSE_RATE_LIMITED:
    // 1013: the hub accepted the upgrade and then closed because it is not ready (Redis down or restarting)
    case LIVE_CLOSE_UNAVAILABLE:
      return "retry-max";
    default:
      return "retry";
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

/** Validates a raw text frame. Returns undefined for anything malformed or unknown. */
export const parseFrame = (raw: unknown): TServerFrame | undefined => {
  if (typeof raw !== "string") return undefined;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isRecord(data)) return undefined;
  switch (data.type) {
    case "ping":
    case "resync":
    case "unsubscribed":
      return { type: data.type };
    case "subscribed":
      return { type: "subscribed", project_ids: stringArray(data.project_ids), denied: stringArray(data.denied) };
    case "revoked":
      return { type: "revoked", project_ids: stringArray(data.project_ids) };
    case "events": {
      if (typeof data.project_id !== "string" || !Array.isArray(data.items)) return undefined;
      const items: TLiveItem[] = [];
      for (const item of data.items) {
        if (!isRecord(item) || typeof item.issue_id !== "string") continue;
        items.push({
          issue_id: item.issue_id,
          kinds: stringArray(item.kinds),
          verbs: stringArray(item.verbs),
          actor_ids: stringArray(item.actor_ids),
        });
      }
      return { type: "events", project_id: data.project_id, items, full_refresh: data.full_refresh === true };
    }
    default:
      return undefined;
  }
};

/** Number of ids a frame adds to the hidden-tab buffer (a full refresh counts as one). */
const frameWeight = (event: TLiveEvent) => (event.type === "events" ? Math.max(1, event.items.length) : 1);

export const buildLiveEventsUrl = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    // built like the page collaboration url: base url (or the page origin), ws/wss by page protocol
    const LIVE_SERVER_BASE_URL = LIVE_BASE_URL?.trim() || window.location.origin;
    const url = new URL(LIVE_SERVER_BASE_URL);
    url.protocol = window.location.protocol === "https:" ? "wss" : "ws";
    url.pathname = `${LIVE_BASE_PATH}/events`;
    return url.toString();
  } catch {
    return undefined;
  }
};

/**
 * One socket per tab, shared by every subscriber. Subscriptions are ref-counted per project.
 * Authentication is the session cookie sent with the upgrade request; nothing else is sent.
 */
export class LiveEventsClient {
  private listeners = new Map<string, Set<TLiveListener>>();
  private workspaceSlugs = new Map<string, string>();
  /** projects the hub refused; not re-requested until every subscriber of the project is gone */
  private denied = new Set<string>();
  private socket: WebSocket | undefined;
  private socketAbort: AbortController | undefined;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private watchdogTimer: ReturnType<typeof setTimeout> | undefined;
  private hiddenTimer: ReturnType<typeof setTimeout> | undefined;
  private stableTimer: ReturnType<typeof setTimeout> | undefined;
  /** when the last reopen resync was emitted; a hub resync frame right after it is a duplicate */
  private lastReopenResyncAt: number | undefined;
  private forceMaxBackoff = false;
  private pausedUntilActivity = false;
  private stopped = false;
  /** the hub answered 4404: live events are not enabled on this deployment; the indicator stays hidden */
  private disabled = false;
  private closedWhileHidden = false;
  /** when the connection was lost; kept across failed reconnect attempts so the gap spans all of them */
  private disconnectedAt: number | undefined;
  /** set when events may have been lost regardless of the gap length (silent death, hidden close, offline) */
  private forceResync = false;
  private hiddenBuffer: TLiveEvent[] = [];
  private hiddenBufferWeight = 0;
  private hiddenOverflow = false;
  private globalListenersAttached = false;
  /** connection state observers and the last state sent to them */
  private connectionListeners = new Set<TLiveConnectionListener>();
  private connectionStatus: TLiveConnectionStatus = { state: "idle" };
  /** a socket of this session has been open at least once (reconnecting vs connecting) */
  private everConnected = false;

  /** the current connection state. Stable object identity until the state changes. */
  getConnectionStatus = (): TLiveConnectionStatus => this.connectionStatus;

  /** observes the connection state (useSyncExternalStore shape). Returns the unsubscribe function. */
  subscribeConnectionStatus = (listener: TLiveConnectionListener): (() => void) => {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  };

  /** Derives the state from the client fields and notifies the observers when it changed. */
  private updateConnectionStatus() {
    let next: TLiveConnectionStatus;
    if (this.listeners.size === 0) next = { state: "idle" };
    // live events are off on this deployment (the default): nothing to show
    else if (this.disabled) next = { state: "idle" };
    else if (this.stopped) next = { state: "offline", offlineReason: "stopped" };
    else if (this.pausedUntilActivity) next = { state: "offline", offlineReason: "unauthenticated" };
    else if (!this.isOnline()) next = { state: "offline", offlineReason: "network" };
    else if (this.socket?.readyState === 1) next = { state: "connected" };
    else next = { state: this.everConnected ? "reconnecting" : "connecting" };
    const current = this.connectionStatus;
    if (current.state === next.state && current.offlineReason === next.offlineReason) return;
    this.connectionStatus = next;
    for (const listener of this.connectionListeners) {
      try {
        listener(next);
      } catch (error) {
        console.error("live events connection listener failed", error);
      }
    }
  }

  /**
   * one listener for several projects of a workspace (the workspace views). Sends one subscribe frame
   * for the projects that are new, and one unsubscribe frame when it ends: the hub rate-limits subscribe
   * frames per user, so a project-by-project subscribe could close the socket.
   */
  subscribeMany(workspaceSlug: string, projectIds: string[], listener: TLiveListener): () => void {
    const ids = [...new Set(projectIds)];
    if (ids.length === 0) return () => {};
    const fresh: string[] = [];
    for (const projectId of ids) {
      let set = this.listeners.get(projectId);
      if (!set) {
        set = new Set();
        this.listeners.set(projectId, set);
        fresh.push(projectId);
      }
      set.add(listener);
      this.workspaceSlugs.set(projectId, workspaceSlug);
    }
    this.attachGlobalListeners();
    // a navigation counts as user activity: it lifts a 4401 pause
    this.pausedUntilActivity = false;
    if (fresh.length > 0) this.sendSubscribe(fresh);
    this.ensureConnected();
    this.updateConnectionStatus();

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const gone: string[] = [];
      for (const projectId of ids) {
        const current = this.listeners.get(projectId);
        if (!current) continue;
        current.delete(listener);
        if (current.size > 0) continue;
        this.listeners.delete(projectId);
        this.workspaceSlugs.delete(projectId);
        this.denied.delete(projectId);
        gone.push(projectId);
      }
      if (gone.length > 0) this.send({ type: "unsubscribe", project_ids: gone });
      if (this.listeners.size === 0) this.shutdown();
      this.updateConnectionStatus();
    };
  }

  /** Subscribes to a project. Returns the unsubscribe function. */
  subscribe(workspaceSlug: string, projectId: string, listener: TLiveListener): () => void {
    let set = this.listeners.get(projectId);
    const isFirstForProject = !set;
    if (!set) {
      set = new Set();
      this.listeners.set(projectId, set);
    }
    set.add(listener);
    this.attachGlobalListeners();
    // a navigation counts as user activity: it lifts a 4401 pause
    this.pausedUntilActivity = false;

    this.workspaceSlugs.set(projectId, workspaceSlug);
    if (isFirstForProject) this.sendSubscribe([projectId]);
    this.ensureConnected();
    this.updateConnectionStatus();

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const current = this.listeners.get(projectId);
      if (!current) return;
      current.delete(listener);
      if (current.size > 0) return;
      this.listeners.delete(projectId);
      this.workspaceSlugs.delete(projectId);
      this.denied.delete(projectId);
      this.send({ type: "unsubscribe", project_ids: [projectId] });
      if (this.listeners.size === 0) this.shutdown();
      this.updateConnectionStatus();
    };
  }

  // ---- connection ----

  private isOnline = () => typeof navigator === "undefined" || navigator.onLine !== false;
  private isHidden = () => typeof document !== "undefined" && document.visibilityState === "hidden";

  private ensureConnected() {
    if (this.listeners.size === 0 || this.stopped || this.pausedUntilActivity) return;
    if (this.socket || this.reconnectTimer) return;
    if (!this.isOnline()) return;
    // a socket closed for being hidden stays closed until the tab is visible again
    if (this.closedWhileHidden && this.isHidden()) return;
    this.connect();
  }

  private connect() {
    const url = buildLiveEventsUrl();
    if (!url || typeof WebSocket === "undefined") return;
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.socket = socket;
    this.closedWhileHidden = false;

    const abort = new AbortController();
    this.socketAbort = abort;
    const { signal } = abort;

    socket.addEventListener(
      "open",
      () => {
        // the backoff is NOT reset here: a hub that accepts the upgrade and then closes would turn every
        // retry into a first retry. It resets once the connection proves stable.
        this.stableTimer = setTimeout(this.markStable, SETTLE_WINDOW_MS);
        this.resetWatchdog();
        this.everConnected = true;
        this.updateConnectionStatus();
        // roles may have changed while the socket was down: ask again
        this.denied.clear();
        this.sendSubscribe([...this.listeners.keys()]);
        // anything may have been missed while the socket was down: one resync, but not for a short blip
        if (this.consumeResyncNeed()) {
          this.lastReopenResyncAt = Date.now();
          this.emitResync();
        }
      },
      { signal }
    );
    socket.addEventListener(
      "message",
      (message) => {
        this.resetWatchdog();
        const frame = parseFrame(message.data);
        if (frame) {
          // the first valid server frame proves the hub is serving this connection
          this.markStable();
          this.handleFrame(frame);
        }
      },
      { signal }
    );
    socket.addEventListener(
      "close",
      (closeEvent) => {
        // a close event for a socket that was already replaced is ignored by the abort signal
        this.socket = undefined;
        this.socketAbort = undefined;
        this.clearWatchdog();
        this.clearStableTimer();
        this.markDisconnected();
        this.handleClose(closeEvent.code);
        this.updateConnectionStatus();
      },
      { signal }
    );
  }

  /** the connection proved stable: the next failure starts the backoff from the beginning again */
  private markStable = () => {
    this.clearStableTimer();
    this.attempt = 0;
    this.forceMaxBackoff = false;
  };

  private clearStableTimer() {
    if (this.stableTimer) clearTimeout(this.stableTimer);
    this.stableTimer = undefined;
  }

  private markDisconnected(force = false) {
    this.disconnectedAt ??= Date.now();
    if (force) this.forceResync = true;
  }

  /** True when the gap since the connection was lost needs a resync. Always resets the tracking. */
  private consumeResyncNeed(): boolean {
    const since = this.disconnectedAt;
    const force = this.forceResync;
    this.disconnectedAt = undefined;
    this.forceResync = false;
    if (force) return true;
    return since !== undefined && Date.now() - since > SETTLE_WINDOW_MS;
  }

  private handleClose(code: number) {
    if (this.listeners.size === 0) return;
    if (this.closedWhileHidden) return;
    const decision = decideOnClose(code);
    if (decision === "stop") {
      this.stopped = true;
      if (code === LIVE_CLOSE_NOT_FOUND) this.disabled = true;
      if (code === LIVE_CLOSE_BAD_MESSAGE || code === LIVE_CLOSE_TOO_LARGE) {
        console.error(`live events stopped: the server rejected a message (close code ${code})`);
      }
      return;
    }
    if (decision === "pause") {
      this.pausedUntilActivity = true;
      return;
    }
    if (decision === "retry-max") this.forceMaxBackoff = true;
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.stopped || this.pausedUntilActivity || this.listeners.size === 0) return;
    if (!this.isOnline()) return; // the online event reconnects
    const delay = this.forceMaxBackoff ? getBackoffDelay(Infinity) : getBackoffDelay(this.attempt);
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.ensureConnected();
    }, delay);
  }

  private closeSocket(code = 1000) {
    const socket = this.socket;
    this.socket = undefined;
    this.clearWatchdog();
    this.clearStableTimer();
    if (!socket) return;
    this.socketAbort?.abort();
    this.socketAbort = undefined;
    try {
      socket.close(code);
    } catch {
      // already closed
    }
  }

  private shutdown() {
    this.closeSocket();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.clearHiddenTimer();
    this.detachGlobalListeners();
    this.attempt = 0;
    this.forceMaxBackoff = false;
    this.disconnectedAt = undefined;
    this.forceResync = false;
    this.lastReopenResyncAt = undefined;
    this.denied.clear();
    this.hiddenBuffer = [];
    this.hiddenBufferWeight = 0;
    this.hiddenOverflow = false;
    this.everConnected = false;
  }

  /** one subscribe message per workspace, denied projects are skipped */
  private sendSubscribe(projectIds: string[]) {
    const bySlug = new Map<string, string[]>();
    for (const projectId of projectIds) {
      const slug = this.workspaceSlugs.get(projectId);
      if (!slug || this.denied.has(projectId)) continue;
      bySlug.set(slug, [...(bySlug.get(slug) ?? []), projectId]);
    }
    for (const [workspace_slug, project_ids] of bySlug) this.send({ type: "subscribe", workspace_slug, project_ids });
  }

  private handleFrame(frame: TServerFrame) {
    switch (frame.type) {
      case "ping":
        this.send({ type: "pong" });
        return;
      case "events":
        this.dispatch(frame);
        return;
      case "resync":
        // sent by the hub without a project: every project resyncs. Skipped when the reopen resync just
        // ran: the board has been refetched after the hub's subscription came back, so one refetch is enough
        if (this.lastReopenResyncAt !== undefined && Date.now() - this.lastReopenResyncAt <= SETTLE_WINDOW_MS) return;
        this.emitResync();
        return;
      case "subscribed":
        // denied means no access: it stays denied until the next reconnect. A transient roles failure
        // on the hub is not reported as denied; the hub keeps those projects pending and retries them
        // at its next revalidation tick or the next subscribe
        frame.denied.forEach((projectId) => this.denied.add(projectId));
        return;
      case "revoked":
        for (const projectId of frame.project_ids) {
          this.denied.add(projectId);
          this.emit({ type: "revoked", project_id: projectId });
        }
        return;
      case "unsubscribed":
        return;
    }
  }

  private send(
    payload:
      | { type: "subscribe"; workspace_slug: string; project_ids: string[] }
      | { type: "unsubscribe"; project_ids: string[] }
      | { type: "pong" }
  ) {
    if (this.socket?.readyState !== 1) return; // subscriptions are re-sent on open
    try {
      this.socket.send(JSON.stringify(payload));
    } catch {
      // the close handler recovers
    }
  }

  // ---- watchdog ----

  private resetWatchdog() {
    this.clearWatchdog();
    this.watchdogTimer = setTimeout(() => {
      // no frame (not even a ping) for WATCHDOG_MS: the connection is dead, force a reconnect
      this.closeSocket(4000);
      // the connection was dead for an unknown time before this was noticed
      this.markDisconnected(true);
      this.scheduleReconnect();
      this.updateConnectionStatus();
    }, WATCHDOG_MS);
  }

  private clearWatchdog() {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = undefined;
  }

  // ---- dispatch and hidden-tab buffer ----

  private dispatch(event: TLiveEvent) {
    if (!this.listeners.has(event.project_id)) return;
    if (this.isHidden()) {
      this.bufferHidden(event);
      return;
    }
    this.emit(event);
  }

  private emit(event: TLiveEvent) {
    for (const listener of this.listeners.get(event.project_id) ?? []) {
      try {
        listener(event);
      } catch (error) {
        console.error("live events listener failed", error);
      }
    }
  }

  private emitResync() {
    for (const projectId of this.listeners.keys()) this.emit({ type: "resync", project_id: projectId });
  }

  private bufferHidden(event: TLiveEvent) {
    if (this.hiddenOverflow) return;
    this.hiddenBufferWeight += frameWeight(event);
    if (this.hiddenBufferWeight > HIDDEN_BUFFER_CAP) {
      // too much to replay one by one: a single resync per project is cheaper
      this.hiddenOverflow = true;
      this.hiddenBuffer = [];
      return;
    }
    this.hiddenBuffer.push(event);
  }

  private flushHiddenBuffer() {
    const buffered = this.hiddenBuffer;
    const overflow = this.hiddenOverflow;
    this.hiddenBuffer = [];
    this.hiddenBufferWeight = 0;
    this.hiddenOverflow = false;
    if (overflow) this.emitResync();
    else buffered.forEach((event) => this.emit(event));
  }

  // ---- page lifecycle ----

  private clearHiddenTimer() {
    if (this.hiddenTimer) clearTimeout(this.hiddenTimer);
    this.hiddenTimer = undefined;
  }

  private onVisibilityChange = () => {
    if (this.isHidden()) {
      this.clearHiddenTimer();
      this.hiddenTimer = setTimeout(() => {
        // hidden for too long: give the server its socket back and resync when the tab returns
        this.hiddenTimer = undefined;
        this.closedWhileHidden = true;
        // frames dropped from the hidden buffer cannot be told apart from missed ones
        this.markDisconnected(true);
        this.hiddenBuffer = [];
        this.hiddenBufferWeight = 0;
        this.hiddenOverflow = false;
        this.closeSocket();
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
        this.updateConnectionStatus();
      }, HIDDEN_CLOSE_MS);
      return;
    }
    this.clearHiddenTimer();
    // When the tab becomes visible after the socket closed, cancel the pending backoff
    // timer and reconnect immediately. The existing gap-resync logic will handle the refetch.
    // Paused (4401) and stopped states never have a reconnect timer: scheduleReconnect refuses
    // to create one in either state, so the first branch cannot run then. Otherwise the tab
    // becoming visible is user activity: onActivity lifts a 4401 pause, and a stopped client
    // (4400/4403/4404/4413) stays stopped because ensureConnected refuses to connect.
    if (!this.socket && this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
      this.connect();
    } else {
      this.onActivity();
    }
    if (this.socket) this.flushHiddenBuffer();
    this.updateConnectionStatus();
  };

  /** focus and visibility lift a 4401 pause and wake a closed socket */
  private onActivity = () => {
    this.pausedUntilActivity = false;
    this.ensureConnected();
    this.updateConnectionStatus();
  };

  private onOnline = () => {
    this.attempt = 0;
    // a spurious online event with a healthy socket must not leave a stale resync request behind
    if (!this.socket) this.markDisconnected(true);
    this.ensureConnected();
    this.updateConnectionStatus();
  };

  private onOffline = () => {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.closeSocket();
    this.markDisconnected(true);
    this.updateConnectionStatus();
  };

  private attachGlobalListeners() {
    if (this.globalListenersAttached || typeof window === "undefined") return;
    this.globalListenersAttached = true;
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    window.addEventListener("focus", this.onActivity);
    window.addEventListener("online", this.onOnline);
    window.addEventListener("offline", this.onOffline);
  }

  private detachGlobalListeners() {
    if (!this.globalListenersAttached || typeof window === "undefined") return;
    this.globalListenersAttached = false;
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    window.removeEventListener("focus", this.onActivity);
    window.removeEventListener("online", this.onOnline);
    window.removeEventListener("offline", this.onOffline);
  }
}

let singleton: LiveEventsClient | undefined;
export const getLiveEventsClient = (): LiveEventsClient => (singleton ??= new LiveEventsClient());
