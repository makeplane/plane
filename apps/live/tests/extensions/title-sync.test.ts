/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Connection } from "@hocuspocus/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TitleUpdateManager } from "@/extensions/title-update/title-update-manager";
import { REDIS_TRANSACTION_ORIGIN } from "@/lib/yjs/redis-origin";
import type { HocusPocusServerContext } from "@/types";

const updatePageProperties = vi.fn().mockResolvedValue({});
const getPageService = vi.hoisted(() => vi.fn());
vi.mock("@/services/page/handler", () => ({ getPageService }));
// the built editor package is not needed to exercise title routing
vi.mock("@plane/editor/server", () => ({
  TITLE_EDITOR_EXTENSIONS: [],
  createRealtimeEvent: vi.fn(),
  extractTextFromHTML: (html: string) => html,
  generateTitleProsemirrorJson: vi.fn(),
}));
vi.mock("@/redis", () => ({ redisManager: {} }));
vi.mock("@tiptap/core", () => ({ getSchema: vi.fn() }));
vi.mock("@tiptap/y-tiptap", () => ({ prosemirrorJSONToYDoc: vi.fn() }));

import { TitleSyncExtension } from "@/extensions/title-sync";

const ctx = (userId: string) =>
  ({ userId, documentType: "project_page", cookie: `c-${userId}` }) as HocusPocusServerContext;

describe("title saves use the editing connection's credential", () => {
  afterEach(() => vi.clearAllMocks());

  it("saves with the context passed to scheduleUpdate, not the first loader's", async () => {
    getPageService.mockReturnValue({ updatePageProperties });
    const manager = new TitleUpdateManager("page", 0);
    manager.scheduleUpdate("renamed", ctx("editor"));
    await manager.forceSave();
    expect(getPageService).toHaveBeenCalledWith("project_page", expect.objectContaining({ userId: "editor" }));
  });

  const change = (origin: unknown) => {
    const ext = new TitleSyncExtension() as any;
    const scheduleUpdate = vi.fn();
    ext.titleUpdateManagers.set("page", { scheduleUpdate });
    ext.handleTitleChange("page", [{ currentTarget: { toJSON: () => "<p>t</p>" }, transaction: { origin } }]);
    return scheduleUpdate;
  };

  it("schedules the save with the originating connection's context", () => {
    const connection = Object.create(Connection.prototype) as Connection;
    Object.defineProperty(connection, "context", { value: ctx("writer") });
    expect(change(connection)).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ userId: "writer" }));
  });

  it("does not save changes relayed from another replica or of unknown origin", () => {
    expect(change(REDIS_TRANSACTION_ORIGIN)).not.toHaveBeenCalled();
    expect(change(null)).not.toHaveBeenCalled();
  });
});
