/* 
  Test Suite: BaseUserPermissionStore
  Framework: Vitest (vi/describe/it/expect). If the project uses Jest, replace vi with jest.

  We comprehensively cover:
    - computed helpers: workspaceInfoBySlug, getWorkspaceRoleByWorkspaceSlug, getProjectRolesByWorkspaceSlug, hasPageAccess
    - action helpers: allowPermissions (workspace + project), parseInt handling, onPermissionAllowed callback behavior
    - actions: fetchUserWorkspaceInfo, leaveWorkspace, fetchUserProjectInfo, fetchUserProjectPermissions, joinProject, leaveProject
    - ADMIN escalation from workspace role to project role
    - router fallbacks for workspaceSlug/projectId
    - edge cases: missing inputs, unknown keys, errors

  External dependencies are mocked:
    - @/plane-web/services/workspace.service
    - @/services/project/project-member.service
    - @/services/user.service
    - @plane/constants (permissions enums + sidebar links)
    - @plane/types (minimal shapes used as 'any' in tests)
*/

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock constants used by the store
vi.mock("@plane/constants", () => {
  const EUserPermissions = {
    VIEWER: 1,
    MEMBER: 2,
    ADMIN: 3,
  } as const;

  const EUserPermissionsLevel = {
    WORKSPACE: "WORKSPACE",
    PROJECT: "PROJECT",
  } as const;

  // Keep keys small and deterministic for hasPageAccess tests
  const WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS = [
    { key: "dashboard", access: [EUserPermissions.MEMBER, EUserPermissions.ADMIN] },
    { key: "settings", access: [EUserPermissions.ADMIN] },
  ];

  return {
    EUserPermissions,
    EUserPermissionsLevel,
    WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS,
  };
});

// Mock minimal @plane/types exports used by the store (we only need role shapes)
vi.mock("@plane/types", () => {
  const EUserWorkspaceRoles = {
    ADMIN: "ADMIN",
    MEMBER: "MEMBER",
    GUEST: "GUEST",
  } as const;
  const EUserProjectRoles = {
    VIEWER: 1,
    MEMBER: 2,
    ADMIN: 3,
  } as const;
  return {
    EUserWorkspaceRoles,
    EUserProjectRoles,
  };
});

// Service mocks
const mockWorkspaceServiceInstance = {
  workspaceMemberMe: vi.fn(),
  getWorkspaceUserProjectsRole: vi.fn(),
};
vi.mock("@/plane-web/services/workspace.service", () => {
  return {
    WorkspaceService: vi.fn(() => mockWorkspaceServiceInstance),
  };
});

const mockProjectMemberService = {
  projectMemberMe: vi.fn(),
};
vi.mock("@/services/project/project-member.service", () => ({
  __esModule: true,
  default: mockProjectMemberService,
}));

const mockUserService = {
  leaveWorkspace: vi.fn(),
  joinProject: vi.fn(),
  leaveProject: vi.fn(),
};
vi.mock("@/services/user.service", () => ({
  __esModule: true,
  default: mockUserService,
}));

// Import after mocks so the module under test binds to mocked services.
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";

// Resolve the store source file path; adapt if the actual path differs.
import { BaseUserPermissionStore } from "../base-permissions.store";

// Build a concrete test subclass to implement the abstract method by delegating to the protected helper.
class TestUserPermissionStore extends BaseUserPermissionStore {
  // Delegate to protected getProjectRole to preserve business logic (incl. workspace ADMIN escalation).
  getProjectRoleByWorkspaceSlugAndProjectId = (workspaceSlug: string, projectId: string) => {
    // @ts-ignore protected access allowed in subclass
    return this.getProjectRole(workspaceSlug, projectId);
  };
}

// Minimal RootStore stub matching fields accessed by the store
type RouterStub = { workspaceSlug?: string; projectId?: string };
type RootStoreStub = {
  router: RouterStub;
  projectRoot: { project: { projectMap: Record<string, unknown> } };
};

// Helpers to build a fresh store for each test
const makeStore = (router: RouterStub = {}): { store: TestUserPermissionStore; root: RootStoreStub } => {
  const root: RootStoreStub = {
    router,
    projectRoot: { project: { projectMap: {} } },
  };
  // @ts-expect-error RootStore is broader; we use a focused stub for tests.
  const store = new TestUserPermissionStore(root);
  return { store, root };
};

describe("BaseUserPermissionStore - computed helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("workspaceInfoBySlug returns undefined for falsy slug", () => {
    const { store } = makeStore();
    expect(store.workspaceInfoBySlug("")).toBeUndefined();
  });

  it("workspaceInfoBySlug returns workspace info when present", () => {
    const { store } = makeStore();
    // Arrange
    // @ts-ignore minimal shape
    store.workspaceUserInfo["ws1"] = { role: EUserWorkspaceRoles.MEMBER };
    // Act + Assert
    expect(store.workspaceInfoBySlug("ws1")).toEqual({ role: EUserWorkspaceRoles.MEMBER });
  });

  it("getWorkspaceRoleByWorkspaceSlug returns the role or undefined", () => {
    const { store } = makeStore();
    expect(store.getWorkspaceRoleByWorkspaceSlug("unknown")).toBeUndefined();
    // @ts-ignore minimal shape
    store.workspaceUserInfo["wsX"] = { role: EUserWorkspaceRoles.ADMIN };
    expect(store.getWorkspaceRoleByWorkspaceSlug("wsX")).toBe(EUserWorkspaceRoles.ADMIN);
  });

  it("getProjectRolesByWorkspaceSlug maps project entries via abstract getProjectRoleByWorkspaceSlugAndProjectId", () => {
    const { store } = makeStore();
    // Seed project roles
    // @ts-ignore storing raw numeric roles is sufficient
    store.workspaceProjectsPermissions["ws1"] = { p1: EUserPermissions.MEMBER, p2: EUserPermissions.VIEWER };
    const result = store.getProjectRolesByWorkspaceSlug("ws1");
    expect(result).toEqual({ p1: EUserPermissions.MEMBER, p2: EUserPermissions.VIEWER });
  });

  it("getProjectRolesByWorkspaceSlug respects workspace ADMIN escalation", () => {
    const { store } = makeStore();
    // Workspace ADMIN
    // @ts-ignore minimal shape
    store.workspaceUserInfo["ws1"] = { role: EUserWorkspaceRoles.ADMIN };
    // Seed lower project roles
    // @ts-ignore
    store.workspaceProjectsPermissions["ws1"] = { p1: EUserPermissions.MEMBER, p2: EUserPermissions.VIEWER };
    const result = store.getProjectRolesByWorkspaceSlug("ws1");
    expect(result).toEqual({ p1: EUserPermissions.ADMIN, p2: EUserPermissions.ADMIN });
  });
});

describe("BaseUserPermissionStore - hasPageAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false for missing inputs or unknown key", () => {
    const { store } = makeStore();
    expect(store.hasPageAccess("", "settings")).toBe(false);
    expect(store.hasPageAccess("ws1", "unknown-key")).toBe(false);
  });

  it("allows access when workspace role satisfies required permissions", () => {
    const { store } = makeStore();
    // @ts-ignore minimal shape
    store.workspaceUserInfo["ws1"] = { role: "3" }; // string role that should parse to number 3 (ADMIN)
    expect(store.hasPageAccess("ws1", "settings")).toBe(true); // settings requires ADMIN
  });

  it("denies access when role insufficient", () => {
    const { store } = makeStore();
    // @ts-ignore minimal shape
    store.workspaceUserInfo["ws1"] = { role: EUserPermissions.VIEWER }; // 1
    expect(store.hasPageAccess("ws1", "dashboard")).toBe(false); // needs MEMBER or ADMIN
  });
});

describe("BaseUserPermissionStore - allowPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when no role is resolvable", () => {
    const { store } = makeStore({ workspaceSlug: "ws1" });
    // No workspaceUserInfo seeded
    expect(
      store.allowPermissions([EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE)
    ).toBe(false);
  });

  it("workspace-level: grants when role is in allowed set (with onPermissionAllowed === true)", () => {
    const { store } = makeStore({ workspaceSlug: "ws1" });
    // String role verifies parseInt branch
    // @ts-ignore
    store.workspaceUserInfo["ws1"] = { role: String(EUserPermissions.MEMBER) };
    const onAllowed = vi.fn(() => true);
    const granted = store.allowPermissions(
      [EUserPermissions.VIEWER, EUserPermissions.MEMBER],
      EUserPermissionsLevel.WORKSPACE,
      "ws1",
      undefined,
      onAllowed
    );
    expect(granted).toBe(true);
    expect(onAllowed).toHaveBeenCalledTimes(1);
  });

  it("workspace-level: honors onPermissionAllowed returning false", () => {
    const { store } = makeStore({ workspaceSlug: "ws1" });
    // @ts-ignore
    store.workspaceUserInfo["ws1"] = { role: EUserPermissions.ADMIN };
    const onAllowed = vi.fn(() => false);
    const granted = store.allowPermissions(
      [EUserPermissions.ADMIN],
      EUserPermissionsLevel.WORKSPACE,
      "ws1",
      undefined,
      onAllowed
    );
    expect(granted).toBe(false);
    expect(onAllowed).toHaveBeenCalledTimes(1);
  });

  it("project-level: resolves via getProjectRoleByWorkspaceSlugAndProjectId using router fallbacks", () => {
    const { store } = makeStore({ workspaceSlug: "wsA", projectId: "pA" });
    // Seed project role as MEMBER
    // @ts-ignore
    store.workspaceProjectsPermissions["wsA"] = { pA: EUserPermissions.MEMBER };
    const granted = store.allowPermissions([EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);
    expect(granted).toBe(true);
  });

  it("project-level: denies when role not in allowed set", () => {
    const { store } = makeStore({ workspaceSlug: "wsA", projectId: "pA" });
    // @ts-ignore
    store.workspaceProjectsPermissions["wsA"] = { pA: EUserPermissions.VIEWER };
    const granted = store.allowPermissions([EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT);
    expect(granted).toBe(false);
  });

  it("project-level: workspace ADMIN escalates to ADMIN", () => {
    const { store } = makeStore({ workspaceSlug: "wsA", projectId: "pA" });
    // @ts-ignore
    store.workspaceUserInfo["wsA"] = { role: EUserWorkspaceRoles.ADMIN };
    // Even if project says VIEWER, workspace ADMIN should escalate to ADMIN
    // @ts-ignore
    store.workspaceProjectsPermissions["wsA"] = { pA: EUserPermissions.VIEWER };
    const granted = store.allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
    expect(granted).toBe(true);
  });
});

describe("BaseUserPermissionStore - actions (service-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchUserWorkspaceInfo sets loader and stores response", async () => {
    const { store } = makeStore();
    mockWorkspaceServiceInstance.workspaceMemberMe.mockResolvedValueOnce({ role: EUserWorkspaceRoles.MEMBER });
    const p = store.fetchUserWorkspaceInfo("ws1");
    // loader should be true during the request
    expect(store.loader).toBe(true);
    const resp = await p;
    expect(resp).toEqual({ role: EUserWorkspaceRoles.MEMBER });
    expect(store.loader).toBe(false);
    expect(store.workspaceUserInfo["ws1"]).toEqual({ role: EUserWorkspaceRoles.MEMBER });
    expect(mockWorkspaceServiceInstance.workspaceMemberMe).toHaveBeenCalledWith("ws1");
  });

  it("fetchUserWorkspaceInfo resets loader and rethrows on error", async () => {
    const { store } = makeStore();
    const err = new Error("boom");
    mockWorkspaceServiceInstance.workspaceMemberMe.mockRejectedValueOnce(err);
    await expect(store.fetchUserWorkspaceInfo("ws1")).rejects.toThrow("boom");
    expect(store.loader).toBe(false);
  });

  it("leaveWorkspace calls service and clears related state", async () => {
    const { store } = makeStore();
    // Seed state
    // @ts-ignore
    store.workspaceUserInfo["ws1"] = { role: EUserWorkspaceRoles.MEMBER };
    // @ts-ignore
    store.projectUserInfo["ws1"] = { p1: { role: EUserPermissions.MEMBER } };
    // @ts-ignore
    store.workspaceProjectsPermissions["ws1"] = { p1: EUserPermissions.MEMBER };
    mockUserService.leaveWorkspace.mockResolvedValueOnce(undefined);

    await store.leaveWorkspace("ws1");

    expect(mockUserService.leaveWorkspace).toHaveBeenCalledWith("ws1");
    expect(store.workspaceUserInfo["ws1"]).toBeUndefined();
    expect(store.projectUserInfo["ws1"]).toBeUndefined();
    expect(store.workspaceProjectsPermissions["ws1"]).toBeUndefined();
  });

  it("fetchUserProjectInfo stores project membership and updates workspaceProjectsPermissions", async () => {
    const { store } = makeStore();
    mockProjectMemberService.projectMemberMe.mockResolvedValueOnce({
      role: EUserPermissions.MEMBER,
      id: "member-id",
    });
    const data = await store.fetchUserProjectInfo("ws1", "p1");
    expect(data).toEqual({ role: EUserPermissions.MEMBER, id: "member-id" });
    // @ts-ignore
    expect(store.projectUserInfo["ws1"]["p1"]).toEqual({ role: EUserPermissions.MEMBER, id: "member-id" });
    // @ts-ignore
    expect(store.workspaceProjectsPermissions["ws1"]["p1"]).toBe(EUserPermissions.MEMBER);
    expect(mockProjectMemberService.projectMemberMe).toHaveBeenCalledWith("ws1", "p1");
  });

  it("fetchUserProjectPermissions replaces workspace project roles map", async () => {
    const { store } = makeStore();
    mockWorkspaceServiceInstance.getWorkspaceUserProjectsRole.mockResolvedValueOnce({
      p1: EUserPermissions.VIEWER,
      p2: EUserPermissions.MEMBER,
    });
    const roles = await store.fetchUserProjectPermissions("ws1");
    expect(roles).toEqual({ p1: EUserPermissions.VIEWER, p2: EUserPermissions.MEMBER });
    // @ts-ignore
    expect(store.workspaceProjectsPermissions["ws1"]).toEqual({ p1: EUserPermissions.VIEWER, p2: EUserPermissions.MEMBER });
    expect(mockWorkspaceServiceInstance.getWorkspaceUserProjectsRole).toHaveBeenCalledWith("ws1");
  });

  it("joinProject calls user service and sets project role from workspace role or MEMBER fallback", async () => {
    // Case A: workspace role present -> used
    {
      const { store } = makeStore();
      // @ts-ignore
      store.workspaceUserInfo["ws1"] = { role: EUserPermissions.ADMIN };
      mockUserService.joinProject.mockResolvedValueOnce(undefined);
      await store.joinProject("ws1", "p1");
      // @ts-ignore
      expect(store.workspaceProjectsPermissions["ws1"]["p1"]).toBe(EUserPermissions.ADMIN);
      expect(mockUserService.joinProject).toHaveBeenCalledWith("ws1", ["p1"]);
    }
    vi.clearAllMocks();
    // Case B: workspace role missing -> fallback to MEMBER
    {
      const { store } = makeStore();
      mockUserService.joinProject.mockResolvedValueOnce(undefined);
      await store.joinProject("ws1", "pX");
      // @ts-ignore
      expect(store.workspaceProjectsPermissions["ws1"]["pX"]).toBe(EUserPermissions.MEMBER);
    }
  });

  it("leaveProject calls user service and clears project data + projectMap", async () => {
    const { store, root } = makeStore();
    // Seed data
    // @ts-ignore
    store.workspaceProjectsPermissions["ws1"] = { p1: EUserPermissions.MEMBER, p2: EUserPermissions.ADMIN };
    // @ts-ignore
    store.projectUserInfo["ws1"] = { p1: { role: EUserPermissions.MEMBER } };
    root.projectRoot.project.projectMap["p1"] = { name: "Project 1" };

    mockUserService.leaveProject.mockResolvedValueOnce(undefined);

    await store.leaveProject("ws1", "p1");

    expect(mockUserService.leaveProject).toHaveBeenCalledWith("ws1", "p1");
    // @ts-ignore
    expect(store.workspaceProjectsPermissions["ws1"]["p1"]).toBeUndefined();
    // @ts-ignore
    expect(store.projectUserInfo["ws1"]["p1"]).toBeUndefined();
    expect(root.projectRoot.project.projectMap["p1"]).toBeUndefined();
    // Ensure other project untouched
    // @ts-ignore
    expect(store.workspaceProjectsPermissions["ws1"]["p2"]).toBe(EUserPermissions.ADMIN);
  });
});

describe("BaseUserPermissionStore - negative paths for actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetchUserProjectInfo rethrows service error", async () => {
    const { store } = makeStore();
    mockProjectMemberService.projectMemberMe.mockRejectedValueOnce(new Error("proj error"));
    await expect(store.fetchUserProjectInfo("ws1", "p1")).rejects.toThrow("proj error");
  });

  it("fetchUserProjectPermissions rethrows service error", async () => {
    const { store } = makeStore();
    mockWorkspaceServiceInstance.getWorkspaceUserProjectsRole.mockRejectedValueOnce(new Error("perm error"));
    await expect(store.fetchUserProjectPermissions("ws1")).rejects.toThrow("perm error");
  });

  it("leaveWorkspace rethrows service error", async () => {
    const { store } = makeStore();
    mockUserService.leaveWorkspace.mockRejectedValueOnce(new Error("leave w error"));
    await expect(store.leaveWorkspace("ws1")).rejects.toThrow("leave w error");
  });

  it("joinProject rethrows service error", async () => {
    const { store } = makeStore();
    mockUserService.joinProject.mockRejectedValueOnce(new Error("join error"));
    await expect(store.joinProject("ws1", "p1")).rejects.toThrow("join error");
  });

  it("leaveProject rethrows service error", async () => {
    const { store } = makeStore();
    mockUserService.leaveProject.mockRejectedValueOnce(new Error("leave p error"));
    await expect(store.leaveProject("ws1", "p1")).rejects.toThrow("leave p error");
  });
});