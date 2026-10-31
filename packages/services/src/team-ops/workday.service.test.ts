/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TFinishWorkPayload } from "@plane/types";
import { WorkdayService, buildFinishForm } from "./workday.service";

const BASE = "/api/workspaces/acme/team-ops";

const payload = (overrides: Partial<TFinishWorkPayload> = {}): TFinishWorkPayload => ({
  summary: "Fixed the redirect",
  document_text: "",
  no_document: false,
  attention_message: "",
  attention_teams: [],
  files: [],
  ...overrides,
});

describe("buildFinishForm", () => {
  it("always sends the summary and the no-document confirmation", () => {
    const form = buildFinishForm(payload({ no_document: true }));

    expect(form.get("summary")).toBe("Fixed the redirect");
    expect(form.get("no_document")).toBe("true");
    expect(form.has("document_text")).toBe(false);
    expect(form.has("attention_message")).toBe(false);
  });

  it("sends the attention message with every chosen team, and the files", () => {
    const file = new File(["%PDF-1.4"], "spec.pdf", { type: "application/pdf" });
    const form = buildFinishForm(
      payload({
        attention_message: "Please test",
        attention_teams: ["t1", "t2"],
        files: [file],
        document_text: "notes",
      })
    );

    expect(form.get("attention_message")).toBe("Please test");
    expect(form.getAll("attention_teams")).toEqual(["t1", "t2"]);
    expect(form.getAll("files")).toHaveLength(1);
    expect(form.get("document_text")).toBe("notes");
    expect(form.get("no_document")).toBe("false");
  });

  it("drops the teams when there is no attention message", () => {
    const form = buildFinishForm(payload({ attention_message: "   ", attention_teams: ["t1"] }));

    expect(form.has("attention_teams")).toBe(false);
  });
});

describe("WorkdayService", () => {
  let service: WorkdayService;

  beforeEach(() => {
    service = new WorkdayService("http://api.test");
  });

  it("finishes work with a multipart POST", async () => {
    const post = vi
      .spyOn(service, "post")
      .mockResolvedValue({ data: { session: { id: "s1" }, capped: false } } as never);

    await expect(service.finishWork("acme", payload({ no_document: true }))).resolves.toEqual({
      session: { id: "s1" },
      capped: false,
    });

    expect(post).toHaveBeenCalledWith(`${BASE}/work-sessions/finish/`, expect.any(FormData), {
      headers: { "Content-Type": "multipart/form-data" },
    });
  });

  it("throws the error body of a failed request", async () => {
    vi.spyOn(service, "post").mockRejectedValue({ response: { data: { detail: "Write what you did." } } });

    await expect(service.finishWork("acme", payload())).rejects.toEqual({ detail: "Write what you did." });
  });

  it("lists sessions, time per task and hand-offs", async () => {
    const get = vi
      .spyOn(service, "get")
      .mockResolvedValueOnce({ data: { results: [{ id: "s1" }] } } as never)
      .mockResolvedValueOnce({ data: { results: [], total_seconds: 0 } } as never)
      .mockResolvedValueOnce({ data: { results: [], nodes: [], edges: [] } } as never);
    const range = { from: "2027-01-01", to: "2027-01-07" };

    await expect(service.listSessions("acme", range)).resolves.toEqual([{ id: "s1" }]);
    await service.listTasks("acme", { ...range, user: "u2" });
    await service.getTeamflow("acme", { status: "delivered", team: "t1" });

    expect(get).toHaveBeenNthCalledWith(1, `${BASE}/work-sessions/`, { params: range });
    expect(get).toHaveBeenNthCalledWith(2, `${BASE}/work-tasks/`, { params: { ...range, user: "u2" } });
    expect(get).toHaveBeenNthCalledWith(3, `${BASE}/teamflow/`, { params: { status: "delivered", team: "t1" } });
  });
});
