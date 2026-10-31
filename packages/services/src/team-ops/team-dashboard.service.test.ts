/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";
import { TeamDashboardService } from "./team-dashboard.service";

describe("TeamDashboardService", () => {
  it("asks for the dashboard with the filters", async () => {
    const service = new TeamDashboardService("http://api.test");
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { people_count: 3 } } as never);
    const params = { from: "2027-01-04", to: "2027-01-10", team: "t1" };

    await expect(service.getDashboard("acme", params)).resolves.toEqual({ people_count: 3 });

    expect(get).toHaveBeenCalledWith("/api/workspaces/acme/team-ops/dashboard/", { params });
  });

  it("rethrows the error body", async () => {
    const service = new TeamDashboardService("http://api.test");
    vi.spyOn(service, "get").mockRejectedValue({ response: { data: { error: "no" } } });

    await expect(service.getDashboard("acme", { from: "a", to: "b" })).rejects.toEqual({ error: "no" });
  });
});
