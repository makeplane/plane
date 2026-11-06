/* oxlint-disable no-await-in-loop -- session updates and tool calls must reach the client in order */
import type {
  ContentBlock,
  SessionUpdate,
  ToolCallContent,
  ToolCallLocation,
  ToolCallStatus,
  ToolKind,
} from "@agentclientprotocol/sdk";

export type Emit = (update: SessionUpdate) => Promise<void>;

export interface ToolCallStart {
  readonly title: string;
  readonly kind: ToolKind;
  readonly status?: ToolCallStatus;
  readonly rawInput?: unknown;
  readonly content?: ToolCallContent[];
  readonly locations?: ToolCallLocation[];
}

export interface ToolCallPatch {
  readonly title?: string;
  readonly kind?: ToolKind;
  readonly status?: ToolCallStatus;
  readonly rawInput?: unknown;
  readonly rawOutput?: unknown;
  readonly content?: ToolCallContent[];
  readonly locations?: ToolCallLocation[];
}

/**
 * Maps provider tool ids to ACP `toolCallId`s and keeps each call's lifecycle consistent: one
 * `tool_call`, then `tool_call_update`s, ending in `completed` or `failed`. Provider ids are reused
 * verbatim when they are new to this session; a repeat gets a deterministic suffix.
 */
export class ToolCallTracker {
  readonly #emit: Emit;
  readonly #byProviderId = new Map<string, string>();
  readonly #used = new Set<string>();
  readonly #open = new Set<string>();
  /** Last announced title/kind/rawInput/locations per call, so a repeat announcement is not resent. */
  readonly #announced = new Map<string, string>();
  #counter = 0;

  constructor(emit: Emit) {
    this.#emit = emit;
  }

  /** The ACP id for a provider id, allocating one if needed. */
  idFor(providerId: string | undefined): string {
    if (providerId) {
      const existing = this.#byProviderId.get(providerId);
      if (existing) return existing;
    }
    let id = providerId || `call_${++this.#counter}`;
    while (this.#used.has(id)) id = `${providerId || "call"}_${++this.#counter}`;
    this.#used.add(id);
    if (providerId) this.#byProviderId.set(providerId, id);
    return id;
  }

  has(providerId: string): boolean {
    return this.#byProviderId.has(providerId);
  }

  isOpen(toolCallId: string): boolean {
    return this.#open.has(toolCallId);
  }

  /** Route a provider id to a call that is already announced, e.g. an approval card for the call it approved. */
  bind(providerId: string, toolCallId: string): void {
    this.#byProviderId.set(providerId, toolCallId);
  }

  /**
   * Announce a tool call. A second start for the same provider id is sent as an update carrying
   * only what changed, or not at all when nothing did.
   */
  async start(providerId: string | undefined, start: ToolCallStart): Promise<string> {
    const known = providerId ? this.#byProviderId.get(providerId) : undefined;
    if (known) {
      const previous = JSON.parse(this.#announced.get(known) ?? "{}") as Record<string, unknown>;
      const changed = Object.fromEntries(
        Object.entries(stripUndefined(start)).filter(
          ([key, value]) => JSON.stringify(previous[key]) !== JSON.stringify(value)
        )
      ) as ToolCallPatch;
      if (Object.keys(changed).length) {
        this.#announced.set(known, JSON.stringify({ ...previous, ...changed }));
        await this.update(known, changed);
      }
      return known;
    }
    const toolCallId = this.idFor(providerId);
    this.#open.add(toolCallId);
    this.#announced.set(toolCallId, JSON.stringify(stripUndefined(start)));
    await this.#emit({
      sessionUpdate: "tool_call",
      toolCallId,
      title: start.title,
      kind: start.kind,
      status: start.status ?? "pending",
      ...(start.rawInput === undefined ? {} : { rawInput: start.rawInput }),
      ...(start.content ? { content: start.content } : {}),
      ...(start.locations ? { locations: start.locations } : {}),
    });
    return toolCallId;
  }

  async update(toolCallId: string, patch: ToolCallPatch): Promise<void> {
    if (patch.status === "completed" || patch.status === "failed") this.#open.delete(toolCallId);
    await this.#emit({ sessionUpdate: "tool_call_update", toolCallId, ...stripUndefined(patch) });
  }

  /** Close every call still open, e.g. when a turn is cancelled or fails. */
  async failOpen(reason: string): Promise<void> {
    // Snapshot: `update` removes each call from the set.
    for (const toolCallId of Array.from(this.#open)) {
      await this.update(toolCallId, { status: "failed", rawOutput: { error: reason } });
    }
  }
}

/**
 * Streams assistant text and thoughts with deterministic `messageId`s: `<turn>-<n>` per contiguous
 * block, so a thought, a tool call or an explicit `breakMessage()` starts a new message.
 */
export class MessageWriter {
  readonly #emit: Emit;
  readonly #turn: number;
  #seq = 0;
  #current: { kind: "agent" | "thought"; id: string } | undefined;

  constructor(emit: Emit, turn: number) {
    this.#emit = emit;
    this.#turn = turn;
  }

  async text(delta: string): Promise<void> {
    if (delta) await this.#chunk("agent", { type: "text", text: delta });
  }

  async thought(delta: string): Promise<void> {
    if (delta) await this.#chunk("thought", { type: "text", text: delta });
  }

  breakMessage(): void {
    this.#current = undefined;
  }

  async #chunk(kind: "agent" | "thought", content: ContentBlock): Promise<void> {
    if (this.#current?.kind !== kind) this.#current = { kind, id: `m${this.#turn}-${++this.#seq}` };
    await this.#emit({
      sessionUpdate: kind === "agent" ? "agent_message_chunk" : "agent_thought_chunk",
      content,
      messageId: this.#current.id,
    });
  }
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
}

/** Flatten an ACP prompt into text for providers without rich input. */
export function promptToText(prompt: readonly ContentBlock[]): string {
  return prompt
    .map((block) => {
      switch (block.type) {
        case "text":
          return block.text;
        case "resource_link":
          return `[${block.title ?? block.name}](${block.uri})`;
        case "resource": {
          const resource = block.resource;
          return "text" in resource
            ? `<resource uri="${resource.uri}">\n${resource.text}\n</resource>`
            : `[${resource.uri}]`;
        }
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}
