/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import {
  AgentChatSession,
  AgentDisconnectedError,
  AgentRequestError,
  AUTH_REQUIRED,
  INVALID_PARAMS,
  agentSocketUrl,
  effortOption,
  modelOption,
  openWebSocketTransport,
} from "@plane/acp-client";
import type { AgentChatSnapshot, LoadSessionOptions, SessionConfigOption, SessionInfo } from "@plane/acp-client";
import { AGENT_BRIDGE_BASE_PATH, AGENT_BRIDGE_BASE_URL } from "@plane/constants";
import { WorkspaceAgentService } from "@plane/services";
import type { TWorkspaceAgent } from "@plane/types";

/** What the user was doing when a request failed; picks the error message. */
export type TAgentChatAction =
  | "connect"
  | "new_session"
  | "load_session"
  | "list_sessions"
  | "prompt"
  | "set_mode"
  | "set_model"
  | "set_effort"
  | "reconnect";

export type TAgentChatError =
  /** `session/set_mode` above the admin maximum (or to a mode the agent does not know): -32602. */
  | { kind: "mode_not_allowed"; modeId: string }
  /** Any other JSON-RPC error from the agent or the bridge. */
  | { kind: "request"; action: TAgentChatAction; code: number; message: string }
  /** The request failed and the socket is gone; the close banner says why. */
  | { kind: "disconnected"; action: TAgentChatAction }
  | { kind: "unknown"; action: TAgentChatAction; message: string };

export type TAgentChatSessionFactory = (target: { agentId: string; workspaceSlug: string }) => AgentChatSession;

/** The model and effort a member last used with an agent, to start the next chat on them. */
export type TAgentChatChoices = { model?: string; effort?: string };

export interface IAgentChatChoicesStorage {
  recall: (workspaceSlug: string, agentId: string) => TAgentChatChoices;
  remember: (workspaceSlug: string, agentId: string, choices: TAgentChatChoices) => void;
}

const CHOICES_KEY = "agent_chat_choices";

/** Per browser, like the last agent: a convenience, so a missing or blocked storage just means defaults. */
export const localChoicesStorage: IAgentChatChoicesStorage = {
  recall: (workspaceSlug, agentId) => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(`${CHOICES_KEY}:${workspaceSlug}:${agentId}`) ?? "{}");
      if (!value || typeof value !== "object") return {};
      const { model, effort } = value as Record<string, unknown>;
      return {
        ...(typeof model === "string" ? { model } : {}),
        ...(typeof effort === "string" ? { effort } : {}),
      };
    } catch {
      return {};
    }
  },
  remember: (workspaceSlug, agentId, choices) => {
    try {
      localStorage.setItem(`${CHOICES_KEY}:${workspaceSlug}:${agentId}`, JSON.stringify(choices));
    } catch {
      // Storage is unavailable (private mode, blocked site data): the next chat starts on the defaults.
    }
  },
};

function toSessionChoices(choices: TAgentChatChoices): LoadSessionOptions {
  return {
    ...(choices.model ? { initialModel: choices.model } : {}),
    ...(choices.effort ? { initialEffort: choices.effort } : {}),
  };
}

export interface IAgentChatStore {
  // observables
  agentsByWorkspace: Record<string, TWorkspaceAgent[]>;
  agentsLoading: boolean;
  agentsError: boolean;
  workspaceSlug: string | null;
  agentId: string | null;
  snapshot: AgentChatSnapshot | null;
  error: TAgentChatError | null;
  sessions: SessionInfo[];
  sessionsLoading: boolean;
  // computed
  activeAgent: TWorkspaceAgent | undefined;
  isConnecting: boolean;
  canPrompt: boolean;
  supportsLoad: boolean;
  supportsList: boolean;
  modelConfig: SessionConfigOption | undefined;
  effortConfig: SessionConfigOption | undefined;
  // helpers
  getWorkspaceAgents: (workspaceSlug: string) => TWorkspaceAgent[] | undefined;
  // actions
  fetchAgents: (workspaceSlug: string) => Promise<TWorkspaceAgent[]>;
  openChat: (workspaceSlug: string, agentId: string) => Promise<void>;
  closeChat: () => void;
  startNewSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  fetchSessions: () => Promise<void>;
  sendPrompt: (text: string) => Promise<void>;
  cancelTurn: () => Promise<void>;
  setPermissionLevel: (modeId: string) => Promise<void>;
  setModel: (value: string) => Promise<void>;
  setEffort: (value: string) => Promise<void>;
  respondToPermission: (permissionId: string, optionId: string | null) => void;
  reconnect: () => Promise<void>;
  clearError: () => void;
}

const defaultSessionFactory: TAgentChatSessionFactory = ({ agentId, workspaceSlug }) => {
  const url = agentSocketUrl({
    agentId,
    workspaceSlug,
    baseUrl: AGENT_BRIDGE_BASE_URL,
    basePath: AGENT_BRIDGE_BASE_PATH,
  });
  return new AgentChatSession({
    transport: () => openWebSocketTransport(url),
    clientInfo: { name: "plane-web", title: "Plane", version: process.env.VITE_APP_VERSION || "dev" },
  });
};

/**
 * The in-app agent chat. One chat (one ACP connection) at a time: the bridge caps open chats per
 * user, so switching agents or leaving the page closes the previous one.
 *
 * The protocol work lives in `@plane/acp-client`'s `AgentChatSession`; this store mirrors its
 * snapshots into MobX and turns its errors into UI state.
 */
export class AgentChatStore implements IAgentChatStore {
  agentsByWorkspace: Record<string, TWorkspaceAgent[]> = {};
  agentsLoading = false;
  agentsError = false;
  workspaceSlug: string | null = null;
  agentId: string | null = null;
  snapshot: AgentChatSnapshot | null = null;
  error: TAgentChatError | null = null;
  sessions: SessionInfo[] = [];
  sessionsLoading = false;

  private session: AgentChatSession | undefined;
  private unsubscribe: (() => void) | undefined;
  private readonly agentService: Pick<WorkspaceAgentService, "list">;
  private readonly createSession: TAgentChatSessionFactory;
  private readonly choices: IAgentChatChoicesStorage;

  constructor(
    options: {
      agentService?: Pick<WorkspaceAgentService, "list">;
      createSession?: TAgentChatSessionFactory;
      choices?: IAgentChatChoicesStorage;
    } = {}
  ) {
    makeObservable<AgentChatStore, "setError">(this, {
      // observables
      agentsByWorkspace: observable,
      agentsLoading: observable.ref,
      agentsError: observable.ref,
      workspaceSlug: observable.ref,
      agentId: observable.ref,
      // the snapshot is immutable; replacing it is the change
      snapshot: observable.ref,
      error: observable.ref,
      sessions: observable.ref,
      sessionsLoading: observable.ref,
      // computed
      activeAgent: computed,
      isConnecting: computed,
      canPrompt: computed,
      supportsLoad: computed,
      supportsList: computed,
      modelConfig: computed,
      effortConfig: computed,
      // actions
      fetchAgents: action,
      openChat: action,
      closeChat: action,
      startNewSession: action,
      loadSession: action,
      fetchSessions: action,
      sendPrompt: action,
      cancelTurn: action,
      setPermissionLevel: action,
      setModel: action,
      setEffort: action,
      respondToPermission: action,
      reconnect: action,
      clearError: action,
      setError: action,
    });
    this.agentService = options.agentService ?? new WorkspaceAgentService();
    this.createSession = options.createSession ?? defaultSessionFactory;
    this.choices = options.choices ?? localChoicesStorage;
  }

  get activeAgent(): TWorkspaceAgent | undefined {
    if (!this.workspaceSlug || !this.agentId) return undefined;
    return this.agentsByWorkspace[this.workspaceSlug]?.find((agent) => agent.id === this.agentId);
  }

  get isConnecting(): boolean {
    const status = this.snapshot?.status;
    return status === "connecting" || status === "reconnecting";
  }

  get canPrompt(): boolean {
    return this.snapshot?.status === "ready" && !!this.snapshot.sessionId && !this.snapshot.prompting;
  }

  get supportsLoad(): boolean {
    return this.snapshot?.capabilities?.loadSession === true;
  }

  get supportsList(): boolean {
    return this.snapshot?.capabilities?.sessionCapabilities?.list != null;
  }

  get modelConfig(): SessionConfigOption | undefined {
    return this.snapshot ? modelOption(this.snapshot.transcript) : undefined;
  }

  get effortConfig(): SessionConfigOption | undefined {
    return this.snapshot ? effortOption(this.snapshot.transcript) : undefined;
  }

  /**
   * The model and effort the chat runs on now: the session's last reported ones (they survive a
   * pending or failed load), else the ones remembered for this agent.
   */
  private currentChoices(): LoadSessionOptions {
    const reported = this.session?.choices ?? {};
    if (reported.initialModel || !this.workspaceSlug || !this.agentId) return reported;
    return toSessionChoices(this.choices.recall(this.workspaceSlug, this.agentId));
  }

  /** Remember the current model and effort for this agent, so its next chat starts on them. */
  private rememberChoices(): void {
    if (!this.workspaceSlug || !this.agentId) return;
    const { initialModel, initialEffort } = this.currentChoices();
    this.choices.remember(this.workspaceSlug, this.agentId, {
      ...(initialModel ? { model: initialModel } : {}),
      ...(initialEffort ? { effort: initialEffort } : {}),
    });
  }

  getWorkspaceAgents = (workspaceSlug: string): TWorkspaceAgent[] | undefined => this.agentsByWorkspace[workspaceSlug];

  fetchAgents = async (workspaceSlug: string): Promise<TWorkspaceAgent[]> => {
    this.agentsLoading = true;
    this.agentsError = false;
    try {
      const agents = await this.agentService.list(workspaceSlug);
      runInAction(() => {
        this.agentsByWorkspace[workspaceSlug] = agents;
        this.agentsLoading = false;
      });
      return agents;
    } catch (error) {
      runInAction(() => {
        this.agentsLoading = false;
        this.agentsError = true;
      });
      throw error;
    }
  };

  openChat = async (workspaceSlug: string, agentId: string): Promise<void> => {
    this.closeChat();
    this.workspaceSlug = workspaceSlug;
    this.agentId = agentId;
    const session = this.createSession({ agentId, workspaceSlug });
    this.session = session;
    this.unsubscribe = session.subscribe((snapshot) => {
      runInAction(() => {
        if (this.session === session) this.snapshot = snapshot;
      });
    });
    this.snapshot = session.snapshot;
    try {
      await session.connect();
      // No starting mode: the bridge applies the admin's default level. The model and effort are
      // the ones last used with this agent; the agent ignores any it no longer offers.
      await session.newSession(toSessionChoices(this.choices.recall(workspaceSlug, agentId)));
      if (this.session === session && session.supportsList) void this.fetchSessions();
    } catch (error) {
      if (this.session === session) this.setError(error, "connect");
    }
  };

  closeChat = (): void => {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.session?.dispose();
    this.session = undefined;
    this.snapshot = null;
    this.error = null;
    this.sessions = [];
    this.sessionsLoading = false;
    this.agentId = null;
  };

  startNewSession = async (): Promise<void> => {
    const session = this.session;
    if (!session) return;
    this.error = null;
    // Keep the permission level, model and effort the user picked for this chat.
    const modeId = this.snapshot?.transcript.modes?.currentModeId;
    try {
      await session.newSession({ ...this.currentChoices(), ...(modeId ? { initialModeId: modeId } : {}) });
      if (session.supportsList) void this.fetchSessions();
    } catch (error) {
      this.setError(error, "new_session");
    }
  };

  loadSession = async (sessionId: string): Promise<void> => {
    const session = this.session;
    if (!session) return;
    this.error = null;
    try {
      await session.loadSession(sessionId, this.currentChoices());
    } catch (error) {
      this.setError(error, "load_session");
    }
  };

  fetchSessions = async (): Promise<void> => {
    const session = this.session;
    if (!session?.supportsList) return;
    this.sessionsLoading = true;
    try {
      const result = await session.listSessions();
      runInAction(() => {
        if (this.session !== session) return;
        this.sessions = result.sessions;
        this.sessionsLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.sessionsLoading = false;
      });
      this.setError(error, "list_sessions");
    }
  };

  sendPrompt = async (text: string): Promise<void> => {
    const session = this.session;
    const trimmed = text.trim();
    if (!session || !trimmed) return;
    this.error = null;
    try {
      await session.prompt(trimmed);
    } catch (error) {
      this.setError(error, "prompt");
    }
  };

  cancelTurn = async (): Promise<void> => {
    await this.session?.cancel();
  };

  setPermissionLevel = async (modeId: string): Promise<void> => {
    const session = this.session;
    if (!session) return;
    this.error = null;
    try {
      await session.setMode(modeId);
    } catch (error) {
      if (error instanceof AgentRequestError && error.code === INVALID_PARAMS) {
        runInAction(() => {
          this.error = { kind: "mode_not_allowed", modeId };
        });
        return;
      }
      this.setError(error, "set_mode");
    }
  };

  setModel = async (value: string): Promise<void> => {
    const session = this.session;
    if (!session) return;
    this.error = null;
    try {
      await session.setModel(value);
      // Only for the chat that changed: the member may have switched agents meanwhile.
      if (this.session === session) this.rememberChoices();
    } catch (error) {
      this.setError(error, "set_model");
    }
  };

  setEffort = async (value: string): Promise<void> => {
    const session = this.session;
    if (!session) return;
    this.error = null;
    try {
      await session.setEffort(value);
      // Only for the chat that changed: the member may have switched agents meanwhile.
      if (this.session === session) this.rememberChoices();
    } catch (error) {
      this.setError(error, "set_effort");
    }
  };

  respondToPermission = (permissionId: string, optionId: string | null): void => {
    this.session?.respondToPermission(permissionId, optionId);
  };

  reconnect = async (): Promise<void> => {
    const session = this.session;
    if (!session) return;
    this.error = null;
    try {
      await session.reconnect();
      if (session.supportsList) void this.fetchSessions();
    } catch (error) {
      this.setError(error, "reconnect");
    }
  };

  clearError = (): void => {
    this.error = null;
  };

  /** Refetch the agent list in the background; a failure leaves the current list. */
  private async refreshAgents(workspaceSlug: string): Promise<void> {
    try {
      await this.fetchAgents(workspaceSlug);
    } catch {
      // The list stays as it was; the next fetch (menu open, page load) tries again.
    }
  }

  private setError(error: unknown, failedAction: TAgentChatAction): void {
    if (error instanceof AgentDisconnectedError) {
      // The close banner explains a lost connection; only flag it when there is no close info.
      this.error = error.close ? null : { kind: "disconnected", action: failedAction };
      return;
    }
    if (error instanceof AgentRequestError) {
      this.error = { kind: "request", action: failedAction, code: error.code, message: error.message };
      // The agent could not sign in: its key or sign-in is gone, so the list may be out of date.
      if (error.code === AUTH_REQUIRED && this.workspaceSlug) void this.refreshAgents(this.workspaceSlug);
      return;
    }
    this.error = {
      kind: "unknown",
      action: failedAction,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
