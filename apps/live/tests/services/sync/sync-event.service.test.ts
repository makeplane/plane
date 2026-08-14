/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncEventService } from "@/services/sync/sync-event.service";

describe("SyncEventService", () => {
  let service: SyncEventService;
  let getSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new SyncEventService();
    getSpy = vi.fn();
    (service as unknown as { get: typeof getSpy }).get = getSpy;
  });

  it("forwards the workspace slug, since_seq, cookie and device_id", async () => {
    getSpy.mockResolvedValue({ data: { events: [], has_more: false } });

    await service.replay("my-workspace", 42, "session=abc", "device-1");

    expect(getSpy).toHaveBeenCalledWith(
      "/api/workspaces/my-workspace/sync/replay/",
      expect.objectContaining({
        headers: { Cookie: "session=abc" },
        params: { since_seq: 42, device_id: "device-1" },
      })
    );
  });

  it("omits device_id when not provided (web clients)", async () => {
    getSpy.mockResolvedValue({ data: { events: [], has_more: false } });

    await service.replay("my-workspace", 0, "session=abc");

    expect(getSpy).toHaveBeenCalledWith(
      "/api/workspaces/my-workspace/sync/replay/",
      expect.objectContaining({ params: { since_seq: 0 } })
    );
  });

  it("returns the events and has_more flag from the response", async () => {
    const events = [
      {
        id: "1",
        seq: 1,
        entity_type: "issue",
        entity_id: "issue-1",
        action: "created",
        actor: "user-1",
        payload: {},
        created_at: "2026-08-14T00:00:00Z",
      },
    ];
    getSpy.mockResolvedValue({ data: { events, has_more: true } });

    const result = await service.replay("my-workspace", 0, "session=abc");

    expect(result.events).toEqual(events);
    expect(result.has_more).toBe(true);
  });

  it("throws an AppError when the request fails", async () => {
    getSpy.mockRejectedValue(new Error("network error"));

    await expect(service.replay("my-workspace", 0, "session=abc")).rejects.toThrow();
  });
});
