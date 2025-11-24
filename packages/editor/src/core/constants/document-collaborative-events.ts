import type { EPageAccess } from "@plane/constants";
import type { TPage } from "@plane/types";
import type { CreatePayload, BaseActionPayload } from "@/types";

// Define all payload types for each event.
export type ArchivedPayload = CreatePayload<{ archived_at: string | null }>;
export type UnarchivedPayload = BaseActionPayload;
export type LockedPayload = CreatePayload<{ is_locked: boolean }>;
export type UnlockedPayload = BaseActionPayload;
export type MadePublicPayload = CreatePayload<{ access: EPageAccess }>;
export type MadePrivatePayload = CreatePayload<{ access: EPageAccess }>;
export type DeletedPayload = CreatePayload<{ deleted_at: Date | null }>;
export type DuplicatedPayload = CreatePayload<{ new_page_id: string }>;
export type PropertyUpdatedPayload = CreatePayload<Partial<TPage>>;
export type MovedPayload = CreatePayload<{
  new_project_id: string;
  new_page_id: string;
}>;
export type RestoredPayload = CreatePayload<{ deleted_page_ids?: string[] }>;
export type ErrorPayload = CreatePayload<{
  error_message: string;
  error_type: "fetch" | "store";
  error_code?: "content_too_large" | "page_locked" | "page_archived";
  should_disconnect?: boolean;
}>;

// Enhanced DocumentCollaborativeEvents with payload types.
// Both the client name and server name are defined, and we add a "payloadType" property
// so that we can later derive a mapping from client event to payload type.
export const DocumentCollaborativeEvents = {
  lock: {
    client: "locked",
    server: "lock",
    payloadType: {} as LockedPayload,
  },
  unlock: {
    client: "unlocked",
    server: "unlock",
    payloadType: {} as UnlockedPayload,
  },
  archive: {
    client: "archived",
    server: "archive",
    payloadType: {} as ArchivedPayload,
  },
  unarchive: {
    client: "unarchived",
    server: "unarchive",
    payloadType: {} as UnarchivedPayload,
  },
  "make-public": {
    client: "made-public",
    server: "make-public",
    payloadType: {} as MadePublicPayload,
  },
  "make-private": {
    client: "made-private",
    server: "make-private",
    payloadType: {} as MadePrivatePayload,
  },
  delete: {
    client: "deleted",
    server: "delete",
    payloadType: {} as DeletedPayload,
  },
  move: {
    client: "moved",
    server: "move",
    payloadType: {} as MovedPayload,
  },
  duplicate: {
    client: "duplicated",
    server: "duplicate",
    payloadType: {} as DuplicatedPayload,
  },
  property_update: {
    client: "property_updated",
    server: "property_update",
    payloadType: {} as PropertyUpdatedPayload,
  },
  restore: {
    client: "restored",
    server: "restore",
    payloadType: {} as RestoredPayload,
  },
  error: {
    client: "error",
    server: "error",
    payloadType: {} as ErrorPayload,
  },
} as const;
