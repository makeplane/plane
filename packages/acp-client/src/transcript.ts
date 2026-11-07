/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type {
  AvailableCommand,
  ContentBlock,
  Cost,
  PlanEntry,
  SessionConfigOption,
  SessionModeState,
  SessionUpdate,
  StopReason,
  ToolCallContent,
  ToolCallLocation,
  ToolCallStatus,
  ToolKind,
} from "@agentclientprotocol/sdk";

/** `_meta` key the bridge sets on an agent message that stands in for a `notice` update. */
export const PLANE_NOTICE_META_KEY = "plane/notice";

/** A non-text content block attached to a message (images, resource links, embedded resources). */
export type TranscriptAttachment = Exclude<ContentBlock, { type: "text" }>;

export interface MessageItem {
  readonly kind: "message";
  readonly id: string;
  readonly role: "user" | "agent";
  readonly messageId: string | null;
  readonly text: string;
  readonly attachments: readonly TranscriptAttachment[];
}

export interface ThoughtItem {
  readonly kind: "thought";
  readonly id: string;
  readonly messageId: string | null;
  readonly text: string;
}

export interface ToolCallItem {
  readonly kind: "tool_call";
  readonly id: string;
  readonly toolCallId: string;
  readonly title: string;
  readonly toolKind: ToolKind;
  readonly status: ToolCallStatus;
  readonly content: readonly ToolCallContent[];
  readonly locations: readonly ToolCallLocation[];
  readonly rawInput?: unknown;
  readonly rawOutput?: unknown;
}

export interface NoticeItem {
  readonly kind: "notice";
  readonly id: string;
  readonly severity: string;
  readonly title: string;
  readonly description: string | null;
  /** Set on notices the client adds itself (e.g. `new_session`); the UI translates them by code. */
  readonly code: string | null;
}

export interface CompactionItem {
  readonly kind: "compaction";
  readonly id: string;
  readonly compactionId: string;
  readonly status: string;
  readonly summary: string;
  readonly error: string | null;
}

/**
 * How a prompt turn ended when it did not finish normally: an ACP stop reason (cancelled, refused,
 * out of tokens...), `failed` (the prompt request returned an error) or `disconnected`.
 */
export type TurnEndReason = StopReason | "failed" | "disconnected";

export interface TurnEndItem {
  readonly kind: "turn_end";
  readonly id: string;
  readonly stopReason: TurnEndReason;
}

export type TranscriptItem = MessageItem | ThoughtItem | ToolCallItem | NoticeItem | CompactionItem | TurnEndItem;

export interface TranscriptUsage {
  readonly used: number;
  readonly size: number;
  readonly cost: Cost | null;
}

export interface TranscriptState {
  readonly items: readonly TranscriptItem[];
  /** Index into `items` by ACP `toolCallId`, so `tool_call_update`s land on the right card. */
  readonly toolCalls: Readonly<Record<string, number>>;
  readonly plan: readonly PlanEntry[] | null;
  readonly usage: TranscriptUsage | null;
  readonly modes: SessionModeState | null;
  readonly configOptions: readonly SessionConfigOption[];
  readonly availableCommands: readonly AvailableCommand[];
  readonly title: string | null;
  readonly updatedAt: string | null;
  /** Counter behind the local item ids (`i1`, `i2`...); ids are stable React keys. */
  readonly nextId: number;
}

export interface SessionSetup {
  readonly modes?: SessionModeState | null;
  readonly configOptions?: readonly SessionConfigOption[] | null;
}

export function createTranscript(setup: SessionSetup = {}): TranscriptState {
  return {
    items: [],
    toolCalls: {},
    plan: null,
    usage: null,
    modes: setup.modes ?? null,
    configOptions: setup.configOptions ?? [],
    availableCommands: [],
    title: null,
    updatedAt: null,
    nextId: 1,
  };
}

function withItem(state: TranscriptState, build: (id: string) => TranscriptItem): TranscriptState {
  const item = build(`i${state.nextId}`);
  const items = [...state.items, item];
  const toolCalls =
    item.kind === "tool_call" ? { ...state.toolCalls, [item.toolCallId]: items.length - 1 } : state.toolCalls;
  return { ...state, items, toolCalls, nextId: state.nextId + 1 };
}

function replaceItem(state: TranscriptState, index: number, item: TranscriptItem): TranscriptState {
  const items = state.items.slice();
  items[index] = item;
  return { ...state, items };
}

/**
 * A chunk continues the last item when it is the same kind (and role) and belongs to the same
 * message: equal `messageId`s, or neither side has one. A different `messageId` starts a new
 * message, as ACP specifies.
 */
function continues(
  last: TranscriptItem | undefined,
  kind: "message" | "thought",
  role: string,
  messageId: string | null
) {
  if (!last || last.kind !== kind) return false;
  if (last.kind === "message" && last.role !== role) return false;
  return last.messageId === messageId;
}

function appendChunk(
  state: TranscriptState,
  kind: "message" | "thought",
  role: "user" | "agent",
  content: ContentBlock,
  messageId: string | null
): TranscriptState {
  const text = content.type === "text" ? content.text : "";
  const attachment = content.type === "text" ? undefined : content;
  const lastIndex = state.items.length - 1;
  const last = state.items[lastIndex];
  if (continues(last, kind, role, messageId) && last && (last.kind === "message" || last.kind === "thought")) {
    if (last.kind === "thought") return replaceItem(state, lastIndex, { ...last, text: last.text + text });
    return replaceItem(state, lastIndex, {
      ...last,
      text: last.text + text,
      attachments: attachment ? [...last.attachments, attachment] : last.attachments,
    });
  }
  if (kind === "thought") return withItem(state, (id) => ({ kind: "thought", id, messageId, text }));
  return withItem(state, (id) => ({
    kind: "message",
    id,
    role,
    messageId,
    text,
    attachments: attachment ? [attachment] : [],
  }));
}

/**
 * Add a notice. Client-side notices carry a `code` for the UI to translate. An agent or bridge
 * notice that is already in the transcript is not repeated (the bridge re-sends its Plane-MCP
 * warning for every session a reconnect opens).
 */
export function appendNotice(
  state: TranscriptState,
  severity: string,
  title: string,
  description: string | null,
  code: string | null = null
): TranscriptState {
  const isRepeat =
    code === null &&
    state.items.some(
      (item) =>
        item.kind === "notice" &&
        item.code === null &&
        item.severity === severity &&
        item.title === title &&
        item.description === description
    );
  if (isRepeat) return state;
  return withItem(state, (id) => ({ kind: "notice", id, severity, title, description, code }));
}

type ToolCallFields = Partial<Omit<ToolCallItem, "kind" | "id" | "toolCallId">>;

/** Copy the fields an update actually carries; `null`/absent means "unchanged" in ACP. */
function toolCallFields(update: {
  title?: string | null;
  kind?: ToolKind | null;
  status?: ToolCallStatus | null;
  content?: ToolCallContent[] | null;
  locations?: ToolCallLocation[] | null;
  rawInput?: unknown;
  rawOutput?: unknown;
}): ToolCallFields {
  const fields: { -readonly [K in keyof ToolCallFields]: ToolCallFields[K] } = {};
  if (update.title != null) fields.title = update.title;
  if (update.kind != null) fields.toolKind = update.kind;
  if (update.status != null) fields.status = update.status;
  if (update.content != null) fields.content = update.content;
  if (update.locations != null) fields.locations = update.locations;
  if (update.rawInput !== undefined) fields.rawInput = update.rawInput;
  if (update.rawOutput !== undefined) fields.rawOutput = update.rawOutput;
  return fields;
}

function upsertToolCall(state: TranscriptState, toolCallId: string, fields: ToolCallFields): TranscriptState {
  const index = state.toolCalls[toolCallId];
  const existing = index === undefined ? undefined : state.items[index];
  if (index !== undefined && existing?.kind === "tool_call") {
    return replaceItem(state, index, { ...existing, ...fields });
  }
  return withItem(state, (id) => ({
    kind: "tool_call",
    id,
    toolCallId,
    title: "",
    toolKind: "other",
    status: "pending",
    content: [],
    locations: [],
    ...fields,
  }));
}

function compactionText(blocks: readonly ContentBlock[] | null | undefined): string {
  return (blocks ?? []).map((block) => (block.type === "text" ? block.text : "")).join("");
}

function upsertCompaction(
  state: TranscriptState,
  compactionId: string,
  change: (item: CompactionItem | undefined) => Omit<CompactionItem, "kind" | "id" | "compactionId">
): TranscriptState {
  const index = state.items.findIndex((item) => item.kind === "compaction" && item.compactionId === compactionId);
  const existing = index === -1 ? undefined : (state.items[index] as CompactionItem);
  if (existing) return replaceItem(state, index, { ...existing, ...change(existing) });
  return withItem(state, (id) => ({ kind: "compaction", id, compactionId, ...change(undefined) }));
}

/**
 * Apply one ACP `session/update` to the transcript. Pure: returns a new state (or the same one
 * for update kinds the chat does not show), never mutates its input.
 */
export function applySessionUpdate(state: TranscriptState, update: SessionUpdate): TranscriptState {
  switch (update.sessionUpdate) {
    case "user_message_chunk":
      return appendChunk(state, "message", "user", update.content, update.messageId ?? null);
    case "agent_message_chunk": {
      if (update._meta?.[PLANE_NOTICE_META_KEY] === true) {
        const text = update.content.type === "text" ? update.content.text : "";
        return appendNotice(state, "warning", text, null);
      }
      return appendChunk(state, "message", "agent", update.content, update.messageId ?? null);
    }
    case "agent_thought_chunk":
      return appendChunk(state, "thought", "agent", update.content, update.messageId ?? null);
    case "tool_call":
      return upsertToolCall(state, update.toolCallId, {
        title: update.title,
        toolKind: update.kind ?? "other",
        status: update.status ?? "pending",
        content: update.content ?? [],
        locations: update.locations ?? [],
        ...toolCallFields({ rawInput: update.rawInput, rawOutput: update.rawOutput }),
      });
    case "tool_call_update":
      return upsertToolCall(state, update.toolCallId, toolCallFields(update));
    case "plan":
      return { ...state, plan: update.entries };
    case "usage_update":
      return { ...state, usage: { used: update.used, size: update.size, cost: update.cost ?? null } };
    case "current_mode_update":
      return state.modes
        ? { ...state, modes: { ...state.modes, currentModeId: update.currentModeId } }
        : { ...state, modes: { currentModeId: update.currentModeId, availableModes: [] } };
    case "config_option_update":
      return { ...state, configOptions: update.configOptions };
    case "available_commands_update":
      return { ...state, availableCommands: update.availableCommands };
    case "session_info_update":
      return {
        ...state,
        title: update.title === undefined ? state.title : update.title,
        updatedAt: update.updatedAt === undefined ? state.updatedAt : update.updatedAt,
      };
    case "notice":
      return appendNotice(state, update.severity, update.title, update.description ?? null);
    case "compaction_update":
      return upsertCompaction(state, update.compactionId, (existing) => ({
        status: update.status,
        summary: update.summary ? compactionText(update.summary) : (existing?.summary ?? ""),
        error: update.error ?? null,
      }));
    case "compaction_summary_chunk":
      return upsertCompaction(state, update.compactionId, (existing) => ({
        status: existing?.status ?? "in_progress",
        summary: (existing?.summary ?? "") + compactionText([update.content]),
        error: existing?.error ?? null,
      }));
    default:
      return state;
  }
}

/** Record the user's own prompt (agents do not echo it back during a live turn). */
export function appendUserPrompt(state: TranscriptState, text: string): TranscriptState {
  return withItem(state, (id) => ({ kind: "message", id, role: "user", messageId: null, text, attachments: [] }));
}

/** Record how a turn ended when it did not end normally. `end_turn` adds nothing. */
export function appendTurnEnd(state: TranscriptState, stopReason: TurnEndReason): TranscriptState {
  if (stopReason === "end_turn") return state;
  return withItem(state, (id) => ({ kind: "turn_end", id, stopReason }));
}

/** Replace the mode and config state with a `session/new|load` or `set_config_option` result. */
export function applySessionSetup(state: TranscriptState, setup: SessionSetup): TranscriptState {
  return {
    ...state,
    modes: setup.modes === undefined ? state.modes : setup.modes,
    configOptions: setup.configOptions == null ? state.configOptions : setup.configOptions,
  };
}

/** The current mode id after a successful `session/set_mode` (ACP sends no update for it). */
export function applyModeChange(state: TranscriptState, modeId: string): TranscriptState {
  return applySessionUpdate(state, { sessionUpdate: "current_mode_update", currentModeId: modeId });
}

export interface SelectChoice {
  readonly value: string;
  readonly name: string;
  readonly description: string | null;
  readonly group: string | null;
}

/** The flattened choices of a `select` config option (grouped or not). Empty for other types. */
export function selectChoices(option: SessionConfigOption | undefined): SelectChoice[] {
  if (!option || option.type !== "select") return [];
  const choices: SelectChoice[] = [];
  for (const entry of option.options) {
    if ("group" in entry) {
      for (const choice of entry.options) {
        choices.push({
          value: choice.value,
          name: choice.name,
          description: choice.description ?? null,
          group: entry.name,
        });
      }
    } else {
      choices.push({ value: entry.value, name: entry.name, description: entry.description ?? null, group: null });
    }
  }
  return choices;
}

/** The model select (`id: "model"`, or the first option in the `model` category). */
export function modelOption(state: TranscriptState): SessionConfigOption | undefined {
  return (
    state.configOptions.find((option) => option.id === "model") ??
    state.configOptions.find((option) => option.category === "model")
  );
}

/** The reasoning effort select (`id: "effort"`, or the first option in the `thought_level` category). */
export function effortOption(state: TranscriptState): SessionConfigOption | undefined {
  return (
    state.configOptions.find((option) => option.id === "effort") ??
    state.configOptions.find((option) => option.category === "thought_level")
  );
}
