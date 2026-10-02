/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { CopilotService } from "@plane/services";
import type {
  TCopilotMemory,
  TCopilotMessage,
  TCopilotSession,
  TCopilotStreamEvent,
  TCopilotToolCall,
  TToolStatus,
} from "@plane/types";

export type TCopilotStreamStatus = "idle" | "connecting" | "streaming" | "error";

export interface ICopilotStore {
  // observables
  session: TCopilotSession | null;
  messages: TCopilotMessage[];
  toolCalls: Record<string, TCopilotToolCall>;
  memories: TCopilotMemory[];
  streamStatus: TCopilotStreamStatus;
  streamError: string | null;
  panelOpen: boolean;
  panelWidth: number;
  lastSequence: number | undefined;
  // computed
  hasRunningTurn: boolean;
  // actions
  loadSession: (workspaceSlug: string, projectId: string, sessionId: string) => Promise<void>;
  sendMessage: (workspaceSlug: string, projectId: string, sessionId: string, content: string) => Promise<void>;
  stop: (workspaceSlug: string, projectId: string, sessionId: string) => Promise<void>;
  openStream: (workspaceSlug: string, projectId: string, sessionId: string) => void;
  closeStream: () => void;
  applyStreamEvent: (event: TCopilotStreamEvent) => void;
  togglePanel: (open?: boolean) => void;
  setPanelWidth: (width: number) => void;
  reset: () => void;
}

const PANEL_DEFAULT_WIDTH = 400;

export class CopilotStore implements ICopilotStore {
  session: TCopilotSession | null = null;
  messages: TCopilotMessage[] = [];
  toolCalls: Record<string, TCopilotToolCall> = {};
  memories: TCopilotMemory[] = [];
  streamStatus: TCopilotStreamStatus = "idle";
  streamError: string | null = null;
  panelOpen = false;
  panelWidth = PANEL_DEFAULT_WIDTH;
  lastSequence: number | undefined = undefined;

  private service = new CopilotService();
  private connection: { close: () => void; lastSeenSequence?: number } | null = null;

  constructor() {
    makeObservable(this, {
      session: observable,
      messages: observable,
      toolCalls: observable,
      memories: observable,
      streamStatus: observable,
      streamError: observable,
      panelOpen: observable,
      panelWidth: observable,
      lastSequence: observable,
      hasRunningTurn: computed,
      loadSession: action.bound,
      sendMessage: action.bound,
      stop: action.bound,
      applyStreamEvent: action.bound,
      togglePanel: action.bound,
      setPanelWidth: action.bound,
      reset: action.bound,
    });
  }

  get hasRunningTurn(): boolean {
    return Object.values(this.toolCalls).some((toolCall) => toolCall.status === "running" && toolCall.awaiting_input);
  }

  async loadSession(workspaceSlug: string, projectId: string, sessionId: string): Promise<void> {
    const session = await this.service.getSession(workspaceSlug, projectId, sessionId);
    runInAction(() => {
      this.session = session;
      this.messages = [...session.messages].toSorted((a: TCopilotMessage, b: TCopilotMessage) => a.sequence - b.sequence);
      this.toolCalls = {};
      for (const message of this.messages) {
        for (const toolCall of message.tool_calls) {
          this.toolCalls[toolCall.id] = toolCall;
        }
      }
      this.memories = session.memories;
      // The transcript already covered the stream's history, so a fresh stream resumes from it.
      this.lastSequence = undefined;
    });
  }

  async sendMessage(workspaceSlug: string, projectId: string, sessionId: string, content: string): Promise<void> {
    const response = await this.service.sendMessage(workspaceSlug, projectId, sessionId, content);
    runInAction(() => {
      this.messages.push(response.user_message);
      if (response.assistant_message) {
        this.messages.push(response.assistant_message);
        for (const toolCall of response.assistant_message.tool_calls) {
          this.toolCalls[toolCall.id] = toolCall;
        }
      }
      // A new turn has been persisted; the stream replays it.
      this.lastSequence = undefined;
    });
  }

  async stop(workspaceSlug: string, projectId: string, sessionId: string): Promise<void> {
    await this.service.stopStream(workspaceSlug, projectId, sessionId);
    runInAction(() => {
      for (const toolCall of Object.values(this.toolCalls)) {
        if (toolCall.status === "running") {
          toolCall.status = "failed";
          toolCall.error = { code: "cancelled", message: "Stopped by the user" };
        }
      }
      this.streamStatus = "idle";
    });
  }

  openStream(workspaceSlug: string, projectId: string, sessionId: string): void {
    this.closeStream();
    this.streamStatus = "connecting";
    this.streamError = null;
    this.connection = this.service.openStream(
      workspaceSlug,
      projectId,
      sessionId,
      {
        onEvent: (event) => this.applyStreamEvent(event),
        onOpen: () =>
          runInAction(() => {
            this.streamStatus = "streaming";
            this.streamError = null;
          }),
        onError: (error) =>
          runInAction(() => {
            this.streamStatus = "error";
            this.streamError = error.message;
          }),
        onClose: () =>
          runInAction(() => {
            this.streamStatus = "idle";
          }),
      },
      { lastEventId: this.lastSequence }
    );
  }

  closeStream(): void {
    if (this.connection) {
      this.lastSequence = this.connection.lastSeenSequence ?? this.lastSequence;
      this.connection.close();
      this.connection = null;
    }
    this.streamStatus = "idle";
  }

  applyStreamEvent(event: TCopilotStreamEvent): void {
    const sequence = (event.data as { sequence?: number }).sequence ?? 0;
    if (sequence > 0) this.lastSequence = sequence;

    switch (event.event) {
      case "message_delta": {
        const { message_id, delta } = event.data;
        const existing = this.messages.find((message) => message.id === message_id);
        if (existing) {
          existing.content += delta;
        } else {
          // A new assistant message appears once its first chunk arrives.
          this.messages.push({
            id: message_id,
            role: "assistant",
            content: delta,
            sequence: Math.floor(sequence / 1000),
            tool_calls: [],
            created_at: "",
            updated_at: "",
          });
        }
        break;
      }
      case "tool_call_start": {
        const { id, name, args, awaiting_input } = event.data;
        this.toolCalls[id] = {
          id,
          name,
          args,
          status: "running",
          result: null,
          error: null,
          is_stale: false,
          is_answered: false,
          awaiting_input,
          created_at: "",
          updated_at: "",
        } as TCopilotToolCall;
        break;
      }
      case "tool_call_update": {
        const existing = this.toolCalls[event.data.id];
        if (!existing) break;
        if (event.data.status) existing.status = event.data.status as TToolStatus;
        if (event.data.awaiting_input !== undefined) existing.awaiting_input = event.data.awaiting_input;
        if (event.data.stale !== undefined) existing.is_stale = event.data.stale;
        if (event.data.result !== undefined) existing.result = { ...existing.result, ...event.data.result };
        break;
      }
      case "tool_call_end": {
        const existing = this.toolCalls[event.data.id];
        if (!existing) break;
        existing.status = event.data.status;
        if (event.data.result !== undefined) existing.result = event.data.result;
        if (event.data.error !== undefined) existing.error = event.data.error;
        break;
      }
    }
  }

  togglePanel(open?: boolean): void {
    this.panelOpen = open ?? !this.panelOpen;
  }

  setPanelWidth(width: number): void {
    this.panelWidth = width;
  }

  reset(): void {
    this.closeStream();
    this.session = null;
    this.messages = [];
    this.toolCalls = {};
    this.memories = [];
    this.streamStatus = "idle";
    this.streamError = null;
    this.lastSequence = undefined;
  }
}
