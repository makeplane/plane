/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimeTrackingService } from "./time-tracking.service";

const SLUG = "acme";

describe("TimeTrackingService", () => {
  let service: TimeTrackingService;

  beforeEach(() => {
    service = new TimeTrackingService("http://api.test");
  });

  it("lists entries with the filters as query params", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { results: [], total_count: 0 } } as never);

    const response = await service.listEntries(SLUG, { user: "u1", from: "2026-10-26", to: "2026-11-01" });

    expect(get).toHaveBeenCalledWith("/api/workspaces/acme/team-ops/time-entries/", {
      params: { user: "u1", from: "2026-10-26", to: "2026-11-01" },
    });
    expect(response).toEqual({ results: [], total_count: 0 });
  });

  it("creates, updates and deletes entries on the right urls", async () => {
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { id: "e1" } } as never);
    const patch = vi.spyOn(service, "patch").mockResolvedValue({ data: { id: "e1", note: "x" } } as never);
    const del = vi.spyOn(service, "delete").mockResolvedValue({ data: undefined } as never);

    await service.createEntry(SLUG, { started_at: "2026-10-30T09:00:00Z", duration_seconds: 600 });
    await service.updateEntry(SLUG, "e1", { note: "x" });
    await expect(service.deleteEntry(SLUG, "e1")).resolves.toBeUndefined();

    expect(post).toHaveBeenCalledWith("/api/workspaces/acme/team-ops/time-entries/", {
      started_at: "2026-10-30T09:00:00Z",
      duration_seconds: 600,
    });
    expect(patch).toHaveBeenCalledWith("/api/workspaces/acme/team-ops/time-entries/e1/", { note: "x" });
    expect(del).toHaveBeenCalledWith("/api/workspaces/acme/team-ops/time-entries/e1/");
  });

  it("reads the summary for a range", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { total_seconds: 60 } } as never);

    await service.getSummary(SLUG, { from: "2026-10-26", to: "2026-11-01" });

    expect(get).toHaveBeenCalledWith("/api/workspaces/acme/team-ops/time-entries/summary/", {
      params: { from: "2026-10-26", to: "2026-11-01" },
    });
  });

  it("unwraps the timer and returns null when none is running", async () => {
    const get = vi.spyOn(service, "get");
    get.mockResolvedValueOnce({ data: { timer: { id: "t1" } } } as never);
    get.mockResolvedValueOnce({ data: { timer: null } } as never);

    expect(await service.getTimer(SLUG)).toEqual({ id: "t1" });
    expect(await service.getTimer(SLUG)).toBeNull();
  });

  it("starts and stops the timer", async () => {
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { timer: { id: "t1" } } } as never);
    const del = vi
      .spyOn(service, "delete")
      .mockResolvedValue({ data: { entry: { id: "e1" }, capped: false } } as never);

    expect(await service.startTimer(SLUG, { issue: "i1" })).toEqual({ id: "t1" });
    expect(await service.stopTimer(SLUG)).toEqual({ entry: { id: "e1" }, capped: false });

    expect(post).toHaveBeenCalledWith("/api/workspaces/acme/team-ops/timer/", { issue: "i1" });
    expect(del).toHaveBeenCalledWith("/api/workspaces/acme/team-ops/timer/");
  });

  it("rethrows the API error body, not the axios error", async () => {
    vi.spyOn(service, "post").mockRejectedValue({ response: { data: { error: "A timer is already running." } } });

    await expect(service.startTimer(SLUG)).rejects.toEqual({ error: "A timer is already running." });
  });
});
