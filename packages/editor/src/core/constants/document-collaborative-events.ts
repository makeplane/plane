import { EPageAccess, EPageSharedUserAccess } from "@plane/constants";
import { TCollaborator } from "@plane/types";
import { CreatePayload, BaseActionPayload } from "@/types";

// Define all payload types for each event.
export type ArchivedPayload = CreatePayload<{ archived_at: string | null }>;
export type UnarchivedPayload = BaseActionPayload;
export type LockedPayload = CreatePayload<{ is_locked: boolean }>;
export type UnlockedPayload = BaseActionPayload;
export type MadePublicPayload = CreatePayload<{ access: EPageAccess }>;
export type MadePrivatePayload = CreatePayload<{ access: EPageAccess }>;
export type DeletedPayload = CreatePayload<{ deleted_at: Date | null }>;
export type DuplicatedPayload = CreatePayload<{ new_page_id: string }>;
export type TitleUpdatedPayload = CreatePayload<{ title: string }>;
export type MovedInternallyPayload = CreatePayload<{
  parent_id?: string | null;
  sub_pages_count?: number;
  old_parent_id?: string;
  new_parent_id?: string;
}>;
export type PublishedPayload = CreatePayload<{
  published_pages: { page_id: string; anchor: string }[];
}>;
export type UnpublishedPayload = CreatePayload<{
  pages_to_unpublish: { page_id: string }[];
}>;
export type MovedPayload = CreatePayload<{
  new_project_id: string;
  new_page_id: string;
}>;
export type CollaboratorsUpdatedPayload = CreatePayload<{ users: TCollaborator[] }>;
export type SharedPayload = CreatePayload<{
  users_and_access: { user_id: string; access: EPageSharedUserAccess; page_id: string[] }[];
}>;
export type UnsharedPayload = CreatePayload<{
  users_and_access: { user_id: string; access: EPageSharedUserAccess; page_id: string[] }[];
}>;
export type RestoredPayload = CreatePayload<{ deleted_page_ids?: string[] }>;
export type SubPagePayload = BaseActionPayload;

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
  publish: {
    client: "published",
    server: "publish",
    payloadType: {} as PublishedPayload,
  },
  unpublish: {
    client: "unpublished",
    server: "unpublish",
    payloadType: {} as UnpublishedPayload,
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
  title_update: {
    client: "title_updated",
    server: "title_update",
    payloadType: {} as TitleUpdatedPayload,
  },
  move_internally: {
    client: "moved_internally",
    server: "move_internally",
    payloadType: {} as MovedInternallyPayload,
  },
  "collaborators-updated": {
    client: "collaborators-updated",
    server: "collaborators-updated",
    payloadType: {} as CollaboratorsUpdatedPayload,
  },
  restore: {
    client: "restored",
    server: "restore",
    payloadType: {} as RestoredPayload,
  },
  sub_page: {
    client: "sub_page",
    server: "sub_page",
    payloadType: {} as SubPagePayload,
  },
  shared: {
    client: "shared",
    server: "shared",
    payloadType: {} as SharedPayload,
  },
  unshared: {
    client: "unshared",
    server: "unshared",
    payloadType: {} as UnsharedPayload,
  },
} as const;
