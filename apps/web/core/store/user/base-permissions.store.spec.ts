/**
 * Tests for BaseUserPermissionStore
 * Framework: Jest (TypeScript). We mock external services and constants.
 *
 * Focus: Validate computed helpers, allowPermissions logic, and async actions
 * (fetch/leave workspace/project, join/leave project, permissions fetch).
 * We create a minimal concrete subclass for the abstract method.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { runInAction } from "mobx";

// Mock @plane/constants to control enums and navigation links deterministically
jest.mock("@plane/constants", () => {
  enum EUserPermissions {
    VIEWER = 1,
    MEMBER = 2,
    ADMIN = 3,
  }
  enum EUserPermissionsLevel {
    WORKSPACE = "WORKSPACE",
    PROJECT = "PROJECT",
  }
  const WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS = [
    { key: "overview", access: [EUserPermissions.VIEWER, EUserPermissions.MEMBER, EUserPermissions.ADMIN] },
    { key: "projects", access: [EUserPermissions.MEMBER, EUserPermissions.ADMIN] },
    { key: "settings", access: [EUserPermissions.ADMIN] },
  ];
  return {
    EUserPermissions,
    EUserPermissionsLevel,
    WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS,
  };
}, { virtual: true });

// Provide minimal runtime enum for workspace roles used by the store
jest.mock("@plane/types", () => ({
  EUserWorkspaceRoles: { ADMIN: 3 },
}), { virtual: true });

// Pull mocked constants/types into scope
import {
  EUserPermissions,
  EUserPermissionsLevel,
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS,
} from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";

// Mock services that the store uses (as virtual modules to avoid resolver config)
const mockWorkspaceMemberMe = jest.fn();
const mockGetWorkspaceUserProjectsRole = jest.fn();

jest.mock("@/plane-web/services/workspace.service", () => {
  return {
    WorkspaceService: jest.fn().mockImplementation(() => ({
      workspaceMemberMe: (...args: any[]) => mockWorkspaceMemberMe(...args),
      getWorkspaceUserProjectsRole: (...args: any[]) => mockGetWorkspaceUserProjectsRole(...args),
    })),
  };
}, { virtual: true });

const mockJoinProject = jest.fn();
const mockLeaveProject = jest.fn();
const mockLeaveWorkspace = jest.fn();

jest.mock("@/services/user.service", () => ({
  __esModule: true,
  default: {
    joinProject: (...args: any[]) => mockJoinProject(...args),
    leaveProject: (...args: any[]) => mockLeaveProject(...args),
    leaveWorkspace: (...args: any[]) => mockLeaveWorkspace(...args),
  },
}), { virtual: true });

const mockProjectMemberMe = jest.fn();
jest.mock("@/services/project/project-member.service", () => ({
  __esModule: true,
  default: {
    projectMemberMe: (...args: any[]) => mockProjectMemberMe(...args),
  },
}), { virtual: true });

// Import after setting up jest.mocks
import type { RootStore } from "@/plane-web/store/root.store";
import { BaseUserPermissionStore } from "./base-permissions.store";

// Minimal concrete subclass exposing the protected getProjectRole via the abstract API
class TestUserPermissionStore extends BaseUserPermissionStore {
  getProjectRoleByWorkspaceSlugAndProjectId = (ws: string, pid: string) => this["getProjectRole"](ws, pid);
}

const makeStore = (overrides?: Partial<RootStore>) =>
  ({
    router: {
      workspaceSlug: "ws-1",
      projectId: "p-1",
      ...(overrides?.router as any),
    },
    projectRoot: {
      project: {
        projectMap: {},
      },
    },
    ...(overrides as any),
  } as RootStore);

describe("BaseUserPermissionStore - computed helpers", () => {
  let store: TestUserPermissionStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new TestUserPermissionStore(makeStore());
  });

  test("workspaceInfoBySlug returns undefined for empty slug and for missing entry", () => {
    expect(store.workspaceInfoBySlug("")).toBeUndefined();
    expect(store.workspaceInfoBySlug("ws-missing")).toBeUndefined();
  });

  test("workspaceInfoBySlug returns stored member info", () => {
    const member = { id: "u1", role: EUserPermissions.ADMIN } as any;
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = member;
    });
    expect(store.workspaceInfoBySlug("ws-1")).toBe(member);
  });

  test("getWorkspaceRoleByWorkspaceSlug returns role or undefined", () => {
    expect(store.getWorkspaceRoleByWorkspaceSlug("ws-NA")).toBeUndefined();
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.MEMBER } as any;
    });
    expect(store.getWorkspaceRoleByWorkspaceSlug("ws-1")).toBe(EUserPermissions.MEMBER);
  });

  test("getProjectRoleByWorkspaceSlugAndProjectId: admin workspace role maps to ADMIN for any project", () => {
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserWorkspaceRoles.ADMIN } as any;
      store.workspaceProjectsPermissions["ws-1"] = { "p-1": EUserPermissions.VIEWER };
    });
    expect(store.getProjectRoleByWorkspaceSlugAndProjectId("ws-1", "p-1")).toBe(EUserPermissions.ADMIN);
  });

  test("getProjectRoleByWorkspaceSlugAndProjectId: returns project role when not admin", () => {
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.MEMBER } as any;
      store.workspaceProjectsPermissions["ws-1"] = { "p-2": EUserPermissions.VIEWER };
    });
    expect(store.getProjectRoleByWorkspaceSlugAndProjectId("ws-1", "p-2")).toBe(EUserPermissions.VIEWER);
  });

  test("getProjectRolesByWorkspaceSlug reduces to available roles using internal computed", () => {
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.MEMBER } as any;
      store.workspaceProjectsPermissions["ws-1"] = {
        "p-1": EUserPermissions.VIEWER,
        "p-2": EUserPermissions.MEMBER,
      };
    });
    const result = store.getProjectRolesByWorkspaceSlug("ws-1");
    expect(result).toEqual({
      "p-1": EUserPermissions.VIEWER,
      "p-2": EUserPermissions.MEMBER,
    });
  });
});

describe("BaseUserPermissionStore - hasPageAccess", () => {
  let store: TestUserPermissionStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new TestUserPermissionStore(makeStore());
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.MEMBER } as any;
    });
  });

  test("returns false for missing slug or key", () => {
    expect(store.hasPageAccess("", "settings")).toBe(false);
    expect(store.hasPageAccess("ws-1", "")).toBe(false);
  });

  test("returns false when key not found in navigation items", () => {
    expect(store.hasPageAccess("ws-1", "unknown")).toBe(false);
  });

  test("grants access based on allowed roles", () => {
    // overview allows VIEWER+
    expect(store.hasPageAccess("ws-1", "overview")).toBe(true);
    // settings allows only ADMIN
    expect(store.hasPageAccess("ws-1", "settings")).toBe(false);
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.ADMIN } as any;
    });
    expect(store.hasPageAccess("ws-1", "settings")).toBe(true);
  });

  test("uses allowPermissions under the hood with workspace-level", () => {
    const entry = WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS.find((i) => i.key === "projects") as any;
    expect(entry.access).toContain(EUserPermissions.MEMBER);
    expect(store.hasPageAccess("ws-1", "projects")).toBe(true);
  });
});

describe("BaseUserPermissionStore - allowPermissions", () => {
  let store: TestUserPermissionStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new TestUserPermissionStore(makeStore());
  });

  test("returns false when current role not available", () => {
    expect(
      store.allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, "ws-1")
    ).toBe(false);
  });

  test("accepts workspace role when included", () => {
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.ADMIN } as any;
    });
    expect(
      store.allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, "ws-1")
    ).toBe(true);
  });

  test("accepts project role when included", () => {
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.MEMBER } as any;
      store.workspaceProjectsPermissions["ws-1"] = { "p-1": EUserPermissions.VIEWER };
    });
    expect(
      store.allowPermissions([EUserPermissions.VIEWER], EUserPermissionsLevel.PROJECT, "ws-1", "p-1")
    ).toBe(true);
  });

  test("uses router fallback when workspaceSlug/projectId not provided", () => {
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.ADMIN } as any;
    });
    expect(store.allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE)).toBe(true);
  });

  test("invokes onPermissionAllowed callback when provided", () => {
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.ADMIN } as any;
    });
    const cb = jest.fn().mockReturnValue(true);
    expect(
      store.allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, "ws-1", undefined, cb)
    ).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test("handles string role by parsing to number", () => {
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: "2" as any } as any; // MEMBER
    });
    expect(
      store.allowPermissions([EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE, "ws-1")
    ).toBe(true);
  });
});

describe("BaseUserPermissionStore - actions", () => {
  let store: TestUserPermissionStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new TestUserPermissionStore(makeStore());
  });

  test("fetchUserWorkspaceInfo stores response and toggles loader", async () => {
    const resp = { id: "me", role: EUserPermissions.MEMBER } as any;
    mockWorkspaceMemberMe.mockResolvedValueOnce(resp);

    const p = store.fetchUserWorkspaceInfo("ws-1");
    expect(store.loader).toBe(true);
    await expect(p).resolves.toBe(resp);
    expect(store.workspaceUserInfo["ws-1"]).toEqual(resp);
    expect(store.loader).toBe(false);
  });

  test("fetchUserWorkspaceInfo propagates error and resets loader", async () => {
    mockWorkspaceMemberMe.mockRejectedValueOnce(new Error("boom"));
    await expect(store.fetchUserWorkspaceInfo("ws-1")).rejects.toThrow("boom");
    expect(store.loader).toBe(false);
  });

  test("leaveWorkspace clears related maps", async () => {
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.ADMIN } as any;
      store.projectUserInfo["ws-1"] = { "p-1": { id: "pm" } as any };
      store.workspaceProjectsPermissions["ws-1"] = { "p-1": EUserPermissions.ADMIN };
    });
    mockLeaveWorkspace.mockResolvedValueOnce(undefined);
    await store.leaveWorkspace("ws-1");
    expect(store.workspaceUserInfo["ws-1"]).toBeUndefined();
    expect(store.projectUserInfo["ws-1"]).toBeUndefined();
    expect(store.workspaceProjectsPermissions["ws-1"]).toBeUndefined();
  });

  test("fetchUserProjectInfo stores membership and permission", async () => {
    const membership = { id: "pm-1", role: EUserPermissions.MEMBER } as any;
    mockProjectMemberMe.mockResolvedValueOnce(membership);
    await store.fetchUserProjectInfo("ws-1", "p-1");
    expect(store.projectUserInfo["ws-1"]["p-1"]).toEqual(membership);
    expect(store.workspaceProjectsPermissions["ws-1"]["p-1"]).toBe(EUserPermissions.MEMBER);
  });

  test("fetchUserProjectPermissions stores entire map", async () => {
    const map = { "p-1": EUserPermissions.VIEWER, "p-2": EUserPermissions.ADMIN } as any;
    mockGetWorkspaceUserProjectsRole.mockResolvedValueOnce(map);
    await store.fetchUserProjectPermissions("ws-1");
    expect(store.workspaceProjectsPermissions["ws-1"]).toEqual(map);
  });

  test("joinProject stores role equal to workspace member role or MEMBER by default", async () => {
    mockJoinProject.mockResolvedValueOnce({ ok: true });
    // no workspace role -> default MEMBER
    await store.joinProject("ws-1", "p-1");
    expect(store.workspaceProjectsPermissions["ws-1"]["p-1"]).toBe(EUserPermissions.MEMBER);

    // with workspace role ADMIN
    runInAction(() => {
      store.workspaceUserInfo["ws-1"] = { role: EUserPermissions.ADMIN } as any;
    });
    mockJoinProject.mockResolvedValueOnce({ ok: true });
    await store.joinProject("ws-1", "p-2");
    expect(store.workspaceProjectsPermissions["ws-1"]["p-2"]).toBe(EUserPermissions.ADMIN);
  });

  test("leaveProject removes entries from permissions, membership and project map", async () => {
    const rs = makeStore();
    (rs as any).projectRoot.project.projectMap["p-1"] = { id: "p-1" };
    store = new TestUserPermissionStore(rs);
    runInAction(() => {
      store.workspaceProjectsPermissions["ws-1"] = { "p-1": EUserPermissions.VIEWER };
      store.projectUserInfo["ws-1"] = { "p-1": { id: "pm-1" } as any };
    });
    mockLeaveProject.mockResolvedValueOnce(undefined);
    await store.leaveProject("ws-1", "p-1");
    expect(store.workspaceProjectsPermissions["ws-1"]?.["p-1"]).toBeUndefined();
    expect(store.projectUserInfo["ws-1"]?.["p-1"]).toBeUndefined();
    expect((rs as any).projectRoot.project.projectMap["p-1"]).toBeUndefined();
  });
});