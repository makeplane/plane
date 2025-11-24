import type { DocumentCollaborativeEvents } from "@/constants/document-collaborative-events";

// Base type for all action payloads
export type BaseActionPayload = {
  user_id?: string;
};

// Generic type for creating specific payloads
export type CreatePayload<T = Record<string, never>> = BaseActionPayload & T;

export type TDocumentEventEmitter = {
  on: (event: string, callback: (message: { payload: TDocumentEventsClient }) => void) => void;
  off: (event: string, callback: (message: { payload: TDocumentEventsClient }) => void) => void;
};

export type TDocumentEventKey = keyof typeof DocumentCollaborativeEvents;
export type TDocumentEventsClient = (typeof DocumentCollaborativeEvents)[TDocumentEventKey]["client"];
export type TDocumentEventsServer = (typeof DocumentCollaborativeEvents)[TDocumentEventKey]["server"];

// In this version, our union of all events (the client names) is:
export type TAllEventTypes = TDocumentEventsClient;

// Create a mapping from each client event to its payload type using key remapping.
export type EventToPayloadMap = {
  [K in keyof typeof DocumentCollaborativeEvents as (typeof DocumentCollaborativeEvents)[K]["client"]]: (typeof DocumentCollaborativeEvents)[K]["payloadType"];
};

// Common fields for every realtime event
export type CommonRealtimeFields = {
  affectedPages: {
    currentPage: string;
    parentPage: string | null;
    descendantPages: string[];
  };
  workspace_slug: string;
  project_id?: string;
  teamspace_id?: string;
  user_id: string;
  timestamp: string;
};

// Helper function to create a realtime event in a type‑safe way.
export function createRealtimeEvent<T extends keyof EventToPayloadMap>(
  opts: ApiServerPayload<T>
): CommonRealtimeFields & BroadcastedEvent<T> {
  return {
    affectedPages: {
      currentPage: opts.page_id || "",
      parentPage: opts.parent_id || null,
      descendantPages: opts.descendants_ids || [],
    },
    workspace_slug: opts.workspace_slug,
    project_id: opts.project_id || "",
    teamspace_id: opts.teamspace_id || "",
    user_id: opts.user_id,
    timestamp: new Date().toISOString(),
    action: opts.action,
    data: opts.data,
  };
}

export type ApiServerPayload<T extends keyof EventToPayloadMap> = {
  action: T;
  descendants_ids: string[];
  page_id?: string;
  parent_id?: string;
  data: EventToPayloadMap[T];
  project_id?: string;
  teamspace_id?: string;
  workspace_slug: string;
  user_id: string;
};

// Create a discriminated union for broadcast payloads.
// For every key in EventToPayloadMap, we make a union member with the common fields.
export type BroadcastPayloadUnion = {
  [K in keyof EventToPayloadMap]: ApiServerPayload<K>;
}[keyof EventToPayloadMap];

export type BroadcastedEventUnion = {
  [K in keyof EventToPayloadMap]: BroadcastedEvent<K>;
}[keyof EventToPayloadMap];

export type BroadcastedEvent<T extends keyof EventToPayloadMap = keyof EventToPayloadMap> = CommonRealtimeFields & {
  action: T;
  data: EventToPayloadMap[T];
};
