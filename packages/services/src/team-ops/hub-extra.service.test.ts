/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { FlowService, HubExtraService } from "./hub-extra.service";

const HUB = "/api/workspaces/acme/team-ops/hub";
const FLOWS = "/api/workspaces/acme/team-ops/teamflow/flows";

describe("HubExtraService", () => {
  let service: HubExtraService;

  beforeEach(() => {
    service = new HubExtraService("http://api.test");
  });

  it("opens a private conversation and lists people", async () => {
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { id: "c1" } } as never);
    vi.spyOn(service, "get").mockResolvedValue({ data: { results: [{ id: "u1" }] } } as never);

    await expect(service.openDirect("acme", "u1")).resolves.toEqual({ id: "c1" });
    await expect(service.listPeople("acme")).resolves.toEqual([{ id: "u1" }]);

    expect(post).toHaveBeenCalledWith(`${HUB}/direct/`, { user: "u1" });
  });

  it("creates a document with POST and changes it with PATCH", async () => {
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { id: "d1" } } as never);
    const patch = vi.spyOn(service, "patch").mockResolvedValue({ data: { id: "d1" } } as never);
    const payload = { title: "Runbook", body: "x", tags: ["ops"], project: null };

    await service.saveDoc("acme", payload);
    await service.saveDoc("acme", payload, "d1");

    expect(post).toHaveBeenCalledWith(`${HUB}/docs/`, payload);
    expect(patch).toHaveBeenCalledWith(`${HUB}/docs/d1/`, payload);
  });

  it("uploads library files as multipart", async () => {
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { results: [{ id: "f1" }] } } as never);
    const file = new File(["%PDF-1.4"], "a.pdf", { type: "application/pdf" });

    await expect(service.uploadFiles("acme", [file])).resolves.toEqual([{ id: "f1" }]);

    const [path, body, config] = post.mock.calls[0];
    expect(path).toBe(`${HUB}/library/`);
    expect((body as FormData).getAll("files")).toHaveLength(1);
    expect(config).toEqual({ headers: { "Content-Type": "multipart/form-data" } });
  });

  it("reveals a secret through POST and returns only the value", async () => {
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { value: "s3cr3t" } } as never);

    await expect(service.revealSecret("acme", "s1")).resolves.toBe("s3cr3t");

    expect(post).toHaveBeenCalledWith(`${HUB}/secrets/s1/reveal/`, {});
  });

  it("sets who may read a secret and reads its log", async () => {
    const put = vi.spyOn(service, "put").mockResolvedValue({ data: { id: "s1" } } as never);
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { results: [{ action: "REVEAL" }] } } as never);

    await service.setSecretAccess("acme", "s1", ["u1"]);
    await expect(service.getSecretLog("acme", "s1")).resolves.toEqual([{ action: "REVEAL" }]);

    expect(put).toHaveBeenCalledWith(`${HUB}/secrets/s1/access/`, { users: ["u1"] });
    expect(get).toHaveBeenCalledWith(`${HUB}/secrets/s1/access/`);
  });

  it("throws the error body of a failed request", async () => {
    vi.spyOn(service, "post").mockRejectedValue({ response: { data: { detail: "Not found." } } });

    await expect(service.revealSecret("acme", "s1")).rejects.toEqual({ detail: "Not found." });
  });
});

describe("FlowService", () => {
  let service: FlowService;

  beforeEach(() => {
    service = new FlowService("http://api.test");
  });

  it("lists, creates, replaces and removes flows", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { results: [], can_manage: true } } as never);
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { id: "f1" } } as never);
    const put = vi.spyOn(service, "put").mockResolvedValue({ data: { id: "f1" } } as never);
    const del = vi.spyOn(service, "delete").mockResolvedValue({ status: 204 } as never);
    const payload = { project: "p1", name: "Release", stages: [{ name: "Build", users: ["u1"] }] };

    await expect(service.list("acme")).resolves.toEqual({ results: [], can_manage: true });
    await service.create("acme", payload);
    await service.update("acme", "f1", payload);
    await service.remove("acme", "f1");

    expect(get).toHaveBeenCalledWith(`${FLOWS}/`);
    expect(post).toHaveBeenCalledWith(`${FLOWS}/`, payload);
    expect(put).toHaveBeenCalledWith(`${FLOWS}/f1/`, payload);
    expect(del).toHaveBeenCalledWith(`${FLOWS}/f1/`);
  });

  it("asks for the people of one project", async () => {
    const get = vi.spyOn(service, "get").mockResolvedValue({ data: { results: [{ id: "u1" }] } } as never);

    await expect(service.listProjectPeople("acme", "p1")).resolves.toEqual([{ id: "u1" }]);

    expect(get).toHaveBeenCalledWith(`${FLOWS}/members/`, { params: { project: "p1" } });
  });
});
