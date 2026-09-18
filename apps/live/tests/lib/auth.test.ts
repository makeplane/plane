/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { currentUserMock, fetchDetailsMock, getPageServiceMock } = vi.hoisted(() => ({
  currentUserMock: vi.fn(),
  fetchDetailsMock: vi.fn(),
  getPageServiceMock: vi.fn(),
}));

vi.mock("@plane/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock("@/services/user.service", () => ({
  UserService: class {
    currentUser = currentUserMock;
  },
}));

vi.mock("@/services/page/handler", () => ({
  getPageService: getPageServiceMock,
}));

import { onAuthenticate } from "@/lib/auth";
import type { HocusPocusServerContext } from "@/types";

const createContext = (): HocusPocusServerContext => ({
  projectId: null,
  cookie: "",
  documentType: "project_page",
  workspaceSlug: null,
  userId: "",
});

const createRequestParameters = () =>
  new URLSearchParams({
    documentType: "project_page",
    projectId: "project-id",
    workspaceSlug: "workspace-slug",
  });

describe("onAuthenticate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUserMock.mockResolvedValue({ id: "user-id", display_name: "Researcher" });
    getPageServiceMock.mockReturnValue({ fetchDetails: fetchDetailsMock });
    fetchDetailsMock.mockResolvedValue({ id: "page-id" });
  });

  it("rejects authentication when the hook payload has no documentName", async () => {
    const requestParameters = createRequestParameters();
    requestParameters.set("documentName", "query-parameter-page-id");

    await expect(
      onAuthenticate({
        documentName: undefined as unknown as string,
        requestHeaders: {},
        requestParameters,
        context: createContext(),
        token: JSON.stringify({ id: "user-id", cookie: "session=valid" }),
      })
    ).rejects.toMatchObject({ code: "AUTH_DOCUMENT_CONTEXT_MISSING" });

    expect(fetchDetailsMock).not.toHaveBeenCalled();
  });

  it("authorizes the documentName supplied by the Hocuspocus hook payload", async () => {
    await onAuthenticate({
      documentName: "payload-page-id",
      requestHeaders: {},
      requestParameters: createRequestParameters(),
      context: createContext(),
      token: JSON.stringify({ id: "user-id", cookie: "session=valid" }),
    });

    expect(getPageServiceMock).toHaveBeenCalledWith("project_page", {
      projectId: "project-id",
      cookie: "session=valid",
      documentType: "project_page",
      workspaceSlug: "workspace-slug",
      userId: "user-id",
    });
    expect(fetchDetailsMock).toHaveBeenCalledOnce();
    expect(fetchDetailsMock).toHaveBeenCalledWith("payload-page-id");
  });
});
