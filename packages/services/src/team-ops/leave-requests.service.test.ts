/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";
import { LeaveRequestService } from "./leave-requests.service";

const BASE = "/api/workspaces/acme/team-ops/leave-requests";

describe("LeaveRequestService", () => {
  it("lists the caller's requests by default and the ones to review on demand", async () => {
    const service = new LeaveRequestService("http://api.test");
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: [] } as never);

    await service.list("acme");
    await service.list("acme", "review");

    expect(get).toHaveBeenNthCalledWith(1, `${BASE}/`, { params: { scope: "mine" } });
    expect(get).toHaveBeenNthCalledWith(2, `${BASE}/`, { params: { scope: "review" } });
  });

  it("creates a request and acts on one", async () => {
    const service = new LeaveRequestService("http://api.test");
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { id: "r1" } } as never);
    const payload = { start_date: "2027-01-04", end_date: "2027-01-08", leave_type: "ANNUAL" as const };

    await service.create("acme", payload);
    await service.act("acme", "r1", "approve", "Enjoy");
    await service.act("acme", "r1", "cancel");

    expect(post).toHaveBeenNthCalledWith(1, `${BASE}/`, payload);
    expect(post).toHaveBeenNthCalledWith(2, `${BASE}/r1/`, { action: "approve", note: "Enjoy" });
    expect(post).toHaveBeenNthCalledWith(3, `${BASE}/r1/`, { action: "cancel", note: "" });
  });

  it("rethrows the error body", async () => {
    const service = new LeaveRequestService("http://api.test");
    vi.spyOn(service, "post").mockRejectedValue({ response: { data: { detail: "no" } } });

    await expect(service.act("acme", "r1", "reject")).rejects.toEqual({ detail: "no" });
  });
});
