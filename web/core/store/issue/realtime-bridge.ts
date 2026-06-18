import type { TIssue } from "@plane/types";
import type { BaseIssuesStore } from "./helpers/base-issues.store";

export const ISSUE_REALTIME_EVENTS = {
  ISSUE_UPDATED: "issue.updated",
} as const;

export type TIssueUpdatedRealtimeEvent = (typeof ISSUE_REALTIME_EVENTS)["ISSUE_UPDATED"];

export type TIssueRealtimePublishParams = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  data: Partial<TIssue>;
};

export type TIssueRealtimePublisher = (params: TIssueRealtimePublishParams) => void | Promise<void>;

export type TIssueUpdatedMutation = TIssueRealtimePublishParams & {
  mutationId: string;
  clientId: string;
  updatedAt: string;
};

export type TIssueRealtimeEventMap = {
  [ISSUE_REALTIME_EVENTS.ISSUE_UPDATED]: TIssueUpdatedMutation;
};

export interface IRealtimeTransport<TEventMap extends object = TIssueRealtimeEventMap> {
  publish<TKey extends Extract<keyof TEventMap, string>>(event: TKey, payload: TEventMap[TKey]): void | Promise<void>;
  subscribe<TKey extends Extract<keyof TEventMap, string>>(
    event: TKey,
    handler: (payload: TEventMap[TKey]) => void | Promise<void>
  ): () => void;
}

type TStoreBinding = {
  previousPublisher: TIssueRealtimePublisher | undefined;
  unsubscribe: () => void;
};

export type TIssueRealtimeBridgeOptions = {
  clientId?: string;
  maxSeenMutations?: number;
};

const getClientId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getMutationId = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `issue-mutation-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getTimestamp = (value: string | undefined | null) => {
  if (!value) return undefined;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
};

export class IssueRealtimeBridge {
  readonly clientId: string;

  private readonly maxSeenMutations: number;
  private readonly seen = new Set<string>();
  private readonly storeBindings = new Map<BaseIssuesStore, TStoreBinding>();

  constructor(
    private readonly transport: IRealtimeTransport<TIssueRealtimeEventMap>,
    options: TIssueRealtimeBridgeOptions = {}
  ) {
    this.clientId = options.clientId ?? getClientId();
    this.maxSeenMutations = options.maxSeenMutations ?? 1_000;
  }

  connectStore = (store: BaseIssuesStore) => {
    const existingBinding = this.storeBindings.get(store);
    if (existingBinding) return () => this.disconnectStore(store);

    const previousPublisher = store.issueRealtimePublisher;

    store.issueRealtimePublisher = async (params) => {
      await previousPublisher?.(params);
      await this.publishIssueUpdate(params);
    };

    const unsubscribe = this.transport.subscribe(ISSUE_REALTIME_EVENTS.ISSUE_UPDATED, (event) =>
      this.applyRemoteIssueUpdate(store, event)
    );

    this.storeBindings.set(store, {
      previousPublisher,
      unsubscribe,
    });

    return () => this.disconnectStore(store);
  };

  disconnectStore = (store: BaseIssuesStore) => {
    const binding = this.storeBindings.get(store);
    if (!binding) return;

    binding.unsubscribe();
    store.issueRealtimePublisher = binding.previousPublisher;
    this.storeBindings.delete(store);
  };

  dispose = () => {
    Array.from(this.storeBindings.keys()).forEach((store) => this.disconnectStore(store));
    this.seen.clear();
  };

  private publishIssueUpdate = async (params: TIssueRealtimePublishParams) => {
    const mutation: TIssueUpdatedMutation = {
      ...params,
      mutationId: getMutationId(),
      clientId: this.clientId,
      updatedAt: new Date().toISOString(),
    };

    this.rememberMutation(mutation.mutationId);

    try {
      await this.transport.publish(ISSUE_REALTIME_EVENTS.ISSUE_UPDATED, mutation);
    } catch (error) {
      console.error("Failed to publish issue realtime mutation", error);
    }
  };

  private applyRemoteIssueUpdate = async (store: BaseIssuesStore, event: TIssueUpdatedMutation) => {
    if (!event?.mutationId || !event.issueId || !event.projectId || !event.workspaceSlug) return;
    if (event.clientId === this.clientId || this.seen.has(event.mutationId)) return;

    this.rememberMutation(event.mutationId);

    const currentIssue = store.rootIssueStore.issues.getIssueById(event.issueId);
    if (!currentIssue) return;

    const currentUpdatedAt = getTimestamp(currentIssue.updated_at);
    const remoteUpdatedAt = getTimestamp(event.updatedAt);
    if (currentUpdatedAt && remoteUpdatedAt && currentUpdatedAt > remoteUpdatedAt) return;

    await store.issueUpdate(
      event.workspaceSlug,
      event.projectId,
      event.issueId,
      {
        ...event.data,
        updated_at: event.updatedAt,
      },
      false
    );
  };

  private rememberMutation = (mutationId: string) => {
    this.seen.add(mutationId);

    if (this.seen.size <= this.maxSeenMutations) return;

    const oldestMutation = this.seen.values().next().value;
    if (oldestMutation) this.seen.delete(oldestMutation);
  };
}
