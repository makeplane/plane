/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, it, expect, vi } from "vitest";
import { AppError } from "@/lib/errors";
import { WorkspacePageService } from "@/services/page/workspace-page.service";

const WORKSPACE_SLUG = "workspace-1";
const COOKIE = "session=abc";
const PAGE_ID = "page-1";

const buildService = () => new WorkspacePageService({ workspaceSlug: WORKSPACE_SLUG, cookie: COOKIE });

describe("WorkspacePageService", () => {
  describe("constructor", () => {
    it("should throw an AppError when workspaceSlug is missing", () => {
      expect(() => new WorkspacePageService({ workspaceSlug: null, cookie: COOKIE })).toThrow(AppError);
      expect(() => new WorkspacePageService({ workspaceSlug: null, cookie: COOKIE })).toThrow(
        /Missing required fields/
      );
    });

    it("should throw an AppError when cookie is missing", () => {
      expect(() => new WorkspacePageService({ workspaceSlug: WORKSPACE_SLUG, cookie: null })).toThrow(AppError);
      expect(() => new WorkspacePageService({ workspaceSlug: WORKSPACE_SLUG, cookie: null })).toThrow(
        /Cookie is required/
      );
    });

    it("should forward the cookie as a request header", () => {
      const service = buildService();
      expect(service.getHeader()).toMatchObject({ Cookie: COOKIE });
    });
  });

  describe("fetchDescriptionBinary", () => {
    it("should GET the workspace-scoped description endpoint", async () => {
      const service = buildService();
      const getSpy = vi
        .spyOn(service, "get")
        .mockResolvedValue({ data: Buffer.from([1, 2, 3]) } as never);

      await service.fetchDescriptionBinary(PAGE_ID);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy.mock.calls[0][0]).toBe(`/api/workspaces/${WORKSPACE_SLUG}/pages/${PAGE_ID}/description/`);
    });
  });

  describe("fetchDetails", () => {
    it("should GET the workspace-scoped page endpoint", async () => {
      const service = buildService();
      const getSpy = vi.spyOn(service, "get").mockResolvedValue({ data: { id: PAGE_ID } } as never);

      await service.fetchDetails(PAGE_ID);

      expect(getSpy.mock.calls[0][0]).toBe(`/api/workspaces/${WORKSPACE_SLUG}/pages/${PAGE_ID}/`);
    });
  });

  describe("updateDescriptionBinary", () => {
    it("should PATCH the workspace-scoped description endpoint", async () => {
      const service = buildService();
      const patchSpy = vi.spyOn(service, "patch").mockResolvedValue({ data: {} } as never);

      const payload = {
        description_binary: "binary",
        description_html: "<p>hi</p>",
        description_json: {},
      };
      await service.updateDescriptionBinary(PAGE_ID, payload as never);

      expect(patchSpy.mock.calls[0][0]).toBe(`/api/workspaces/${WORKSPACE_SLUG}/pages/${PAGE_ID}/description/`);
      expect(patchSpy.mock.calls[0][1]).toEqual(payload);
    });
  });
});
