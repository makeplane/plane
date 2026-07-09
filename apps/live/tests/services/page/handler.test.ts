/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, it, expect } from "vitest";
import { AppError } from "@/lib/errors";
import { getPageService } from "@/services/page/handler";
import { ProjectPageService } from "@/services/page/project-page.service";
import { WorkspacePageService } from "@/services/page/workspace-page.service";
import type { HocusPocusServerContext, TDocumentTypes } from "@/types";

const buildContext = (overrides: Partial<HocusPocusServerContext> = {}): HocusPocusServerContext => ({
  projectId: "project-1",
  workspaceSlug: "workspace-1",
  cookie: "session=abc",
  documentType: "project_page",
  userId: "user-1",
  ...overrides,
});

describe("getPageService", () => {
  it("should resolve project_page to a ProjectPageService", () => {
    const service = getPageService("project_page", buildContext({ documentType: "project_page" }));
    expect(service).toBeInstanceOf(ProjectPageService);
  });

  it("should resolve workspace_page to a WorkspacePageService", () => {
    const service = getPageService(
      "workspace_page",
      buildContext({ documentType: "workspace_page", projectId: null })
    );
    expect(service).toBeInstanceOf(WorkspacePageService);
  });

  it("should not require a projectId for workspace_page", () => {
    expect(() =>
      getPageService("workspace_page", buildContext({ documentType: "workspace_page", projectId: null }))
    ).not.toThrow();
  });

  it("should throw an AppError for an unknown document type", () => {
    expect(() => getPageService("team_page" as TDocumentTypes, buildContext())).toThrow(AppError);
    expect(() => getPageService("team_page" as TDocumentTypes, buildContext())).toThrow(/Invalid document type/);
  });
});
