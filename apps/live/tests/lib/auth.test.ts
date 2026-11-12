/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentUser, getPageAccess } = vi.hoisted(() => ({ currentUser: vi.fn(), getPageAccess: vi.fn() }));
vi.mock("@/services/user.service", () => ({
  UserService: class {
    currentUser = currentUser;
    getPageAccess = getPageAccess;
  },
}));

import { onAuthenticate } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import type { HocusPocusServerContext } from "@/types";

const PAGE_ID = "11111111-1111-4111-8111-111111111111";

const connect = (documentName = PAGE_ID, documentType: string | null = "project_page") => {
  const context = {} as HocusPocusServerContext;
  const connectionConfig = { readOnly: false };
  const result = onAuthenticate({
    requestHeaders: {},
    // a hostile client picks any projectId it likes
    requestParameters: new URLSearchParams({
      workspaceSlug: "ws",
      projectId: "attacker-project",
      ...(documentType === null ? {} : { documentType }),
    }),
    context,
    token: JSON.stringify({ id: "user-1", cookie: "session=abc" }),
    documentName,
    connectionConfig,
  });
  return { result, context, connectionConfig };
};

describe("onAuthenticate page authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser.mockResolvedValue({ id: "user-1", display_name: "U" });
  });

  it("rejects a connection to a page the user cannot access", async () => {
    // APIService rejects with an AppError carrying the response status.
    getPageAccess.mockRejectedValue(new AppError("Page not found", { statusCode: 404 }));
    await expect(connect().result).rejects.toMatchObject({ code: "AUTH_PAGE_ACCESS_DENIED" });
    expect(getPageAccess).toHaveBeenCalledWith("session=abc", "ws", PAGE_ID, "view");
  });

  it("refuses a failed check under its own code, not as a denial", async () => {
    getPageAccess.mockRejectedValue(new AppError("Too many requests", { statusCode: 429, code: "ERR_BAD_RESPONSE" }));
    await expect(connect().result).rejects.toMatchObject({ code: "ERR_BAD_RESPONSE" });
  });

  it("refuses the connection when the answer has no read_only", async () => {
    getPageAccess.mockResolvedValue({ project_id: "real-project" });
    await expect(connect().result).rejects.toMatchObject({ code: "AUTH_PAGE_ACCESS_UNKNOWN" });
  });

  it.each(["server_agent", "ai_agent", "sync_agent", "workspace_page", "bogus", null])(
    "rejects documentType %s before any check",
    async (type) => {
      await expect(connect(PAGE_ID, type).result).rejects.toMatchObject({ code: "AUTH_INVALID_DOCUMENT_TYPE" });
      expect(currentUser).not.toHaveBeenCalled();
      expect(getPageAccess).not.toHaveBeenCalled();
    }
  );

  it("uses the checked page's project and read-only flag, not the socket's", async () => {
    getPageAccess.mockResolvedValue({ project_id: "real-project", read_only: true });
    const { result, context, connectionConfig } = connect();
    await expect(result).resolves.toEqual({ user: { id: "user-1", name: "U" } });
    expect(context.projectId).toBe("real-project");
    expect(connectionConfig.readOnly).toBe(true);
  });
});
