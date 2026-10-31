/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkReportService } from "./work-reports.service";

const BASE = "/api/workspaces/acme/team-ops/work-reports";

describe("WorkReportService", () => {
  let service: WorkReportService;

  beforeEach(() => {
    service = new WorkReportService("http://api.test");
  });

  it("lists reports and unwraps the results", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { results: [{ done: "x" }] } } as never);
    const params = { kind: "DAILY" as const, from: "2027-01-01", to: "2027-01-31" };

    await expect(service.list("acme", params)).resolves.toEqual([{ done: "x" }]);

    expect(get).toHaveBeenCalledWith(`${BASE}/`, { params });
  });

  it("reads one report, naming the person only when given", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { suggestions: [] } } as never);

    await service.getReport("acme", "WEEKLY", "2027-01-04");
    await service.getReport("acme", "DAILY", "2027-01-05", "u2");

    expect(get).toHaveBeenNthCalledWith(1, `${BASE}/WEEKLY/2027-01-04/`, { params: {} });
    expect(get).toHaveBeenNthCalledWith(2, `${BASE}/DAILY/2027-01-05/`, { params: { user: "u2" } });
  });

  it("saves and submits with a PUT", async () => {
    const put = vi.spyOn(service, "put").mockResolvedValue({ data: { status: "SUBMITTED" } } as never);

    await service.saveReport("acme", "DAILY", "2027-01-05", { done: "x", submit: true });

    expect(put).toHaveBeenCalledWith(`${BASE}/DAILY/2027-01-05/`, { done: "x", submit: true });
  });

  it("reads the board and rethrows the error body", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { people: [] } } as never);
    const params = { kind: "DAILY" as const, from: "2027-01-01", to: "2027-01-31", team: "t1" };

    await service.getBoard("acme", params);
    expect(get).toHaveBeenCalledWith(`${BASE}/board/`, { params });

    get.mockRejectedValue({ response: { data: { error: "no" } } });
    await expect(service.getBoard("acme", params)).rejects.toEqual({ error: "no" });
  });
});
