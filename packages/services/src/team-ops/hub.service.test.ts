/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { HubService, buildMessageForm } from "./hub.service";

const BASE = "/api/workspaces/acme/team-ops/hub";

describe("buildMessageForm", () => {
  it("repeats the tags and files as separate fields", () => {
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    const form = buildMessageForm({ body: "Hi", parent: "m1", users: ["u1", "u2"], teams: ["t1"], files: [file] });

    expect(form.get("body")).toBe("Hi");
    expect(form.get("parent")).toBe("m1");
    expect(form.getAll("users")).toEqual(["u1", "u2"]);
    expect(form.getAll("teams")).toEqual(["t1"]);
    expect(form.getAll("files")).toHaveLength(1);
  });

  it("leaves out the parent of a message that is not a reply", () => {
    const form = buildMessageForm({ body: "Hi", parent: null, users: [], teams: [], files: [] });

    expect(form.has("parent")).toBe(false);
  });
});

describe("HubService", () => {
  let service: HubService;

  beforeEach(() => {
    service = new HubService("http://api.test");
  });

  it("lists channels and messages, paging back with `before`", async () => {
    const get = vi
      .spyOn(service, "get")
      .mockResolvedValueOnce({ data: { results: [], unread_mentions: 2 } } as never)
      .mockResolvedValueOnce({ data: { results: [], has_more: false } } as never)
      .mockResolvedValueOnce({ data: { results: [], has_more: false } } as never);

    await expect(service.listChannels("acme")).resolves.toEqual({ results: [], unread_mentions: 2 });
    await service.listMessages("acme", "c1");
    await service.listMessages("acme", "c1", "m9");

    expect(get).toHaveBeenNthCalledWith(1, `${BASE}/channels/`);
    expect(get).toHaveBeenNthCalledWith(2, `${BASE}/channels/c1/messages/`, { params: {} });
    expect(get).toHaveBeenNthCalledWith(3, `${BASE}/channels/c1/messages/`, { params: { before: "m9" } });
  });

  it("posts a message as multipart", async () => {
    const post = vi.spyOn(service, "post").mockResolvedValue({ data: { id: "m1" } } as never);

    await service.postMessage("acme", "c1", { body: "Hi", users: [], teams: [], files: [] });

    expect(post).toHaveBeenCalledWith(`${BASE}/channels/c1/messages/`, expect.any(FormData), {
      headers: { "Content-Type": "multipart/form-data" },
    });
  });

  it("edits, deletes and asks for a fresh file link each time", async () => {
    const patch = vi.spyOn(service, "patch").mockResolvedValue({ data: { id: "m1" } } as never);
    const del = vi.spyOn(service, "delete").mockResolvedValue({ status: 204 } as never);
    const get = vi
      .spyOn(service, "get")
      .mockResolvedValue({ data: { url: "https://files.test/x", name: "a.pdf" } } as never);

    await service.editMessage("acme", "m1", "v2");
    await expect(service.deleteMessage("acme", "m1")).resolves.toBeUndefined();
    await expect(service.getFileLink("acme", "f1")).resolves.toEqual({ url: "https://files.test/x", name: "a.pdf" });

    expect(patch).toHaveBeenCalledWith(`${BASE}/messages/m1/`, { body: "v2" });
    expect(del).toHaveBeenCalledWith(`${BASE}/messages/m1/`);
    expect(get).toHaveBeenCalledWith(`${BASE}/files/f1/`);
  });

  it("reads mentions and marks them read", async () => {
    vi.spyOn(service, "get").mockResolvedValue({ data: { results: [{ id: "x" }] } } as never);
    const post = vi.spyOn(service, "post").mockResolvedValue({ status: 204 } as never);

    await expect(service.listMentions("acme")).resolves.toEqual([{ id: "x" }]);
    await service.markMentionsRead("acme");

    expect(post).toHaveBeenCalledWith(`${BASE}/mentions/`, {});
  });

  it("throws the error body of a failed request", async () => {
    vi.spyOn(service, "get").mockRejectedValue({ response: { data: { error: "nope" } } });

    await expect(service.getChannel("acme", "c1")).rejects.toEqual({ error: "nope" });
  });
});
