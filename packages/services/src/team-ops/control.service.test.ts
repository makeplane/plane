/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ControlService } from "./control.service";

const BASE = "/api/workspaces/acme/team-ops/control";
const range = { from: "2027-01-01", to: "2027-01-07" };

describe("ControlService", () => {
  let service: ControlService;

  beforeEach(() => {
    service = new ControlService("http://api.test");
  });

  it("reads the team table with its filters", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { results: [], totals: {} } } as never);

    await service.getTeam("acme", { ...range, team: "t1" });

    expect(get).toHaveBeenCalledWith(`${BASE}/team/`, { params: { ...range, team: "t1" } });
  });

  it("asks for the CSV as a blob", async () => {
    const blob = new Blob(["Person"]);
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: blob } as never);

    await expect(service.exportTeam("acme", range)).resolves.toBe(blob);

    expect(get).toHaveBeenCalledWith(
      `${BASE}/team/`,
      { params: { ...range, export: "csv" } },
      { responseType: "blob" }
    );
  });

  it("lists freezes and pauses", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { results: [{ kind: "FREEZE" }] } } as never);

    await expect(service.listInterruptions("acme", { ...range, kind: "FREEZE" })).resolves.toEqual([
      { kind: "FREEZE" },
    ]);

    expect(get).toHaveBeenCalledWith(`${BASE}/interruptions/`, { params: { ...range, kind: "FREEZE" } });
  });

  it("locks a channel and moderates its messages", async () => {
    const patch = vi.spyOn(service, "patch").mockResolvedValue({ data: {} } as never);
    const del = vi.spyOn(service, "delete").mockResolvedValue({ status: 204 } as never);
    vi.spyOn(service, "get").mockResolvedValue({ data: { results: [{ id: "m1" }] } } as never);

    await service.setChannelLocked("acme", "c1", true);
    await expect(service.listChannelMessages("acme", "c1")).resolves.toEqual([{ id: "m1" }]);
    await service.removeMessage("acme", "m1");

    expect(patch).toHaveBeenCalledWith(`${BASE}/hub/channels/c1/`, { is_locked: true });
    expect(del).toHaveBeenCalledWith(`${BASE}/hub/messages/m1/`);
  });

  it("reads the Hub and flow overviews and throws the error body", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { channels: [] } } as never);

    await service.getHub("acme");
    await service.getFlows("acme");
    expect(get).toHaveBeenNthCalledWith(1, `${BASE}/hub/`);
    expect(get).toHaveBeenNthCalledWith(2, `${BASE}/flows/`);

    get.mockRejectedValue({ response: { data: { error: "no" } } });
    await expect(service.getHub("acme")).rejects.toEqual({ error: "no" });
  });
});
