/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import type { TCopilotSession } from "@plane/types";
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
});
