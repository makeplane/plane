/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it, vi } from "vitest";

const PAGE_ID = "11111111-1111-4111-8111-111111111111";

vi.mock("@plane/logger", () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

// the real APIService pulls in unbuilt workspace packages; only its `get` matters here
vi.mock("@/services/api.service", () => ({
  APIService: class {
    get = vi.fn();
  },
}));

import { UserService } from "@/services/user.service";

const service = () => {
  const s = new UserService();
  const get = vi.spyOn(s, "get").mockResolvedValue({ data: { project_id: "p", read_only: false } } as never);
  return { s, get: get as unknown as ReturnType<typeof vi.fn> };
};

describe("UserService.getPageAccess", () => {
  it("asks the live-access endpoint with the action and encodes the slug", async () => {
    const { s, get } = service();
    await s.getPageAccess("c", "my.ws", PAGE_ID, "edit");
    expect(get).toHaveBeenCalledWith(`/api/workspaces/my.ws/pages/${PAGE_ID}/live-access/`, {
      headers: { Cookie: "c" },
      params: { action: "edit" },
    });
  });

  it.each([
    ["ws", "../../other"],
    ["ws", `${PAGE_ID}/x`],
    ["a/b", PAGE_ID],
    ["a?b", PAGE_ID],
    ["..", PAGE_ID],
    ["", PAGE_ID],
  ])("refuses slug %j / page %j without calling Django", async (slug, page) => {
    const { s, get } = service();
    await expect(s.getPageAccess("c", slug, page)).rejects.toMatchObject({ code: "INVALID_PAGE_REFERENCE" });
    expect(get).not.toHaveBeenCalled();
  });
});
