/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import type { TCopilotMemory, TCopilotSession } from "@plane/types";
import { APIService } from "../api.service";
import { CopilotService } from "./copilot.service";

const session: TCopilotSession = {
  id: "session-1",
  workspace: "workspace-1",
  project: "project-1",
  entity_type: "page",
  entity_id: "page-1",
  messages: [],
  memories: [],
  created_at: "2026-10-02T10:00:00Z",
  updated_at: "2026-10-02T10:00:00Z",
};

const memory: TCopilotMemory = {
  id: "memory-1",
  content: "Launch is in March",
  created_at: "2026-10-02T10:00:00Z",
  updated_at: "2026-10-02T10:00:00Z",
};

describe("CopilotService", () => {
  const service = new CopilotService("http://localhost:8000");

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getOrCreateSession", () => {
    it("posts the entity to the sessions endpoint and returns the session", async () => {
      const post = vi.spyOn(APIService.prototype, "post").mockResolvedValue({ data: session } as never);
      const payload = { entity_type: "page", entity_id: "page-1" } as const;

      const result = await service.getOrCreateSession("acme", "project-1", payload);

      expect(post).toHaveBeenCalledWith("/api/workspaces/acme/projects/project-1/copilot/sessions/", payload);
      expect(result).toEqual(session);
    });

    it("throws the response data when the request fails", async () => {
      const error = { error: "The page or work item was not found." };
      vi.spyOn(APIService.prototype, "post").mockRejectedValue({ response: { data: error } });

      await expect(
        service.getOrCreateSession("acme", "project-1", { entity_type: "issue", entity_id: "issue-1" })
      ).rejects.toEqual(error);
    });
  });

  describe("getSession", () => {
    it("gets the session from its endpoint and returns it", async () => {
      const get = vi.spyOn(APIService.prototype, "get").mockResolvedValue({ data: session } as never);

      const result = await service.getSession("acme", "project-1", "session-1");

      expect(get).toHaveBeenCalledWith("/api/workspaces/acme/projects/project-1/copilot/sessions/session-1/");
      expect(result).toEqual(session);
    });

    it("throws the response data when the request fails", async () => {
      const error = { error: "The required object does not exist." };
      vi.spyOn(APIService.prototype, "get").mockRejectedValue({ response: { data: error } });

      await expect(service.getSession("acme", "project-1", "session-1")).rejects.toEqual(error);
    });
  });

  describe("listMemories", () => {
    it("gets the memories of a session", async () => {
      const get = vi.spyOn(APIService.prototype, "get").mockResolvedValue({ data: [memory] } as never);

      const result = await service.listMemories("acme", "project-1", "session-1");

      expect(get).toHaveBeenCalledWith("/api/workspaces/acme/projects/project-1/copilot/sessions/session-1/memories/");
      expect(result).toEqual([memory]);
    });

    it("throws the response data when the request fails", async () => {
      const error = { error: "The required object does not exist." };
      vi.spyOn(APIService.prototype, "get").mockRejectedValue({ response: { data: error } });

      await expect(service.listMemories("acme", "project-1", "session-1")).rejects.toEqual(error);
    });
  });

  describe("updateMemory", () => {
    it("patches the memory content and returns the updated memory", async () => {
      const updated = { ...memory, content: "Launch is in April" };
      const patch = vi.spyOn(APIService.prototype, "patch").mockResolvedValue({ data: updated } as never);

      const result = await service.updateMemory("acme", "project-1", "session-1", "memory-1", "Launch is in April");

      expect(patch).toHaveBeenCalledWith(
        "/api/workspaces/acme/projects/project-1/copilot/sessions/session-1/memories/memory-1/",
        { content: "Launch is in April" }
      );
      expect(result).toEqual(updated);
    });

    it("throws the response data when the request fails", async () => {
      const error = { error: "The required object does not exist." };
      vi.spyOn(APIService.prototype, "patch").mockRejectedValue({ response: { data: error } });

      await expect(
        service.updateMemory("acme", "project-1", "session-1", "memory-1", "Launch is in April")
      ).rejects.toEqual(error);
    });
  });

  describe("deleteMemory", () => {
    it("deletes the memory", async () => {
      const del = vi.spyOn(APIService.prototype, "delete").mockResolvedValue({ data: null } as never);

      await service.deleteMemory("acme", "project-1", "session-1", "memory-1");

      expect(del).toHaveBeenCalledWith(
        "/api/workspaces/acme/projects/project-1/copilot/sessions/session-1/memories/memory-1/"
      );
    });

    it("throws the response data when the request fails", async () => {
      const error = { error: "The required object does not exist." };
      vi.spyOn(APIService.prototype, "delete").mockRejectedValue({ response: { data: error } });

      await expect(service.deleteMemory("acme", "project-1", "session-1", "memory-1")).rejects.toEqual(error);
    });
  });
});
