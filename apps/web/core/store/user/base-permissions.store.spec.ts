/**
 * Tests for BaseUserPermissionStore
 *
 * NOTE: This test suite assumes Jest is the test runner with ts-jest.
 * If the repository uses Vitest, replace jest.fn/jest.spyOn with vi.fn/vi.spyOn
 * and update imports accordingly.
 */
import { act } from "mobx";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles, EUserProjectRoles, IUserProjectsRole, IWorkspaceMemberMe, TProjectMembership } from "@plane/types";

// Under test: we import from the actual file path within the repo.
// If the path differs, update the import accordingly.
import { BaseUserPermissionStore } from "./base-permissions.store";

// Mocks for external services that BaseUserPermissionStore uses via module-level singletons
// - WorkspaceService (class)
// - projectMemberService (default object)
// - userService (default object)
// - WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS (constant list)
jest.mock("@/plane-web/services/workspace.service", () => {
  return {
    WorkspaceService: jest.fn().mockImplementation(() => ({
      workspaceMemberMe: jest.fn(),
      getWorkspaceUserProjectsRole: jest.fn(),
    })),
  };
});

jest.mock("@/services/project/project-member.service", () => ({
  __esModule: true,
  default: {
    projectMemberMe: jest.fn(),
  },
}));

jest.mock("@/services/user.service", () => ({
  __esModule: true,
  default: {
    leaveWorkspace: jest.fn(),
    joinProject: jest.fn(),
    leaveProject: jest.fn(),
  },
}));

// We'll replace the WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS with a deterministic stub for hasPageAccess tests.
jest.mock("@plane/constants", () => {
  const actual = jest.requireActual("@plane/constants");
  return {
    ...actual,
    WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS: [
      { key: "settings", access: [actual.EUserPermissions.ADMIN] },
      { key: "reports", access: [actual.EUserPermissions.MEMBER, actual.EUserPermissions.ADMIN] },
    ],
  };
});

import projectMemberService from "@/services/project/project-member.service";
import userService from "@/services/user.service";
import { WorkspaceService } from "@/plane-web/services/workspace.service";
import { WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS } from "@plane/constants";

// Minimal mock RootStore that satisfies the fields used by BaseUserPermissionStore
type AnyObj = Record<string, any>;
const createMockStore = (workspaceSlug = "ws-1", projectId = "p-1") =>
  ({
    router: { workspaceSlug, projectId },
    projectRoot: { project: { projectMap: {} as AnyObj } },
  } as unknown as import("@/plane-web/store/root.store").RootStore);

// Test implementation of abstract class to expose the protected getProjectRole via the abstract API
class TestUserPermissionStore extends BaseUserPermissionStore {
  // Delegate to the protected getProjectRole already implemented in the base class
  getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug: string, projectId: string) {
    // @ts-ignore accessing protected method within subclass
    return this.getProjectRole(workspaceSlug, projectId);
  }
}

describe("BaseUserPermissionStore - computed helpers", () => {
  let store: TestUserPermissionStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new TestUserPermissionStore(createMockStore());
  });

  test("workspaceInfoBySlug returns undefined for falsy or missing slug", () => {
    expect(store.workspaceInfoBySlug("unknown")).toBeUndefined();
    // @ts-expect-error intentional
    expect(store.workspaceInfoBySlug("")).toBeUndefined();
  });

  test("workspaceInfoBySlug returns value when present", () => {
    const wsMember: IWorkspaceMemberMe = { id: "u1", role: EUserWorkspaceRoles.MEMBER } as any;
    store.workspaceUserInfo["ws-1"] = wsMember;
    expect(store.workspaceInfoBySlug("ws-1")).toBe(wsMember);
  });

  test("getWorkspaceRoleByWorkspaceSlug returns role and handles undefined slug", () => {
    expect(store.getWorkspaceRoleByWorkspaceSlug("ws-1")).toBeUndefined();
    store.workspaceUserInfo["ws-1"] = { id: "u2", role: EUserWorkspaceRoles.ADMIN } as any;
    expect(store.getWorkspaceRoleByWorkspaceSlug("ws-1")).toBe(EUserWorkspaceRoles.ADMIN);
  });

  test("getProjectRoleByWorkspaceSlugAndProjectId respects ADMIN workspace override", () => {
    store.workspaceUserInfo["ws-1"] = { id: "u3", role: EUserWorkspaceRoles.ADMIN } as any;
    store.workspaceProjectsPermissions["ws-1"] = { "p-1": EUserPermissions.MEMBER };
    expect(store.getProjectRoleByWorkspaceSlugAndProjectId("ws-1", "p-1")).toBe(EUserPermissions.ADMIN);
  });

  test("getProjectRolesByWorkspaceSlug reduces only defined roles", () => {
    store.workspaceUserInfo["ws-1"] = { id: "u4", role: EUserWorkspaceRoles.MEMBER } as any;
    store.workspaceProjectsPermissions["ws-1"] = {
      "p-1": EUserPermissions.MEMBER,
      "p-2": EUserPermissions.GUEST,
    } as IUserProjectsRole;
    const roles = store.getProjectRolesByWorkspaceSlug("ws-1");
    expect(roles).toEqual({
      "p-1": EUserPermissions.MEMBER,
      "p-2": EUserPermissions.GUEST,
    });
  });
});

describe("BaseUserPermissionStore - hasPageAccess", () => {
  let store: TestUserPermissionStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new TestUserPermissionStore(createMockStore());
  });

  test("returns false for missing inputs or unknown key", () => {
    expect(store.hasPageAccess("", "settings")).toBe(false);
    expect(store.hasPageAccess("ws-1", "unknown")).toBe(false);
  });

  test("grants access when workspace role is in allowed list", () => {
    store.workspaceUserInfo["ws-1"] = { id: "u5", role: EUserPermissions.ADMIN as any } as any;
    expect(WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS.find(i => i.key==="settings")).toBeTruthy();
    expect(store.hasPageAccess("ws-1", "settings")).toBe(true);
  });

  test("denies access when workspace role not permitted", () => {
    store.workspaceUserInfo["ws-1"] = { id: "u6", role: EUserPermissions.GUEST as any } as any;
    expect(store.hasPageAccess("ws-1", "settings")).toBe(false);
  });
});

describe("BaseUserPermissionStore - allowPermissions", () => {
  let store: TestUserPermissionStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = new TestUserPermissionStore(createMockStore("ws-X", "proj-Y"));
  });

  test("uses router defaults when workspaceSlug/projectId not provided", () => {
    store.workspaceUserInfo["ws-X"] = { id: "u7", role: EUserPermissions.MEMBER as any } as any;
    const allowed = store.allowPermissions([EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE);
    expect(allowed).toBe(true);
  });

  test("parses string role into number for comparison", () => {
    store.workspaceUserInfo["ws-X"] = { id: "u8", role: String(EUserPermissions.MEMBER) as any } as any;
    const allowed = store.allowPermissions([EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE, "ws-X");
    expect(allowed).toBe(true);
  });

  test("PROJECT level uses project role via abstract method", () => {
    store.workspaceProjectsPermissions["ws-X"] = { "proj-Y": EUserPermissions.GUEST };
    const allowed = store.allowPermissions([EUserPermissions.GUEST], EUserPermissionsLevel.PROJECT, "ws-X", "proj-Y");
    expect(allowed).toBe(true);
  });

  test("invokes onPermissionAllowed callback when permitted", () => {
    store.workspaceUserInfo["ws-X"] = { id: "u9", role: EUserPermissions.ADMIN as any } as any;
    const cb = jest.fn(() => true);
    const res = store.allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE, "ws-X", undefined, cb);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(res).toBe(true);
  });

  test("returns false when role not allowed", () => {
    store.workspaceUserInfo["ws-X"] = { id: "u10", role: EUserPermissions.GUEST as any } as any;
    expect(store.allowPermissions([EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE, "ws-X")).toBe(false);
  });
});

describe("BaseUserPermissionStore - actions", () => {
  let store: TestUserPermissionStore;
  let wsService: jest.Mocked<InstanceType<typeof WorkspaceService>>;

  function getWorkspaceServiceMock() {
    // The module-level instance was constructed from the mocked class; grab its prototype spies
    // @ts-ignore - access the mock constructor
    const Ctor = WorkspaceService as unknown as jest.Mock;
    const instance = Ctor.mock.instances[0] as any;
    return instance as jest.Mocked<InstanceType<typeof WorkspaceService>>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    // reset class mock to get fresh instance
    (WorkspaceService as unknown as jest.Mock).mockClear();
    store = new TestUserPermissionStore(createMockStore("acme", "prj1"));
    wsService = getWorkspaceServiceMock();
  });

  test("fetchUserWorkspaceInfo stores response and toggles loader", async () => {
    const member: IWorkspaceMemberMe = { id: "me", role: EUserWorkspaceRoles.MEMBER } as any;
    wsService.workspaceMemberMe.mockResolvedValue(member);

    const p = store.fetchUserWorkspaceInfo("acme");
    // loader should be true during fetch
    expect(store.loader).toBe(true);
    const res = await p;

    expect(res).toBe(member);
    expect(store.workspaceUserInfo["acme"]).toEqual(member);
    expect(store.loader).toBe(false);
    expect(wsService.workspaceMemberMe).toHaveBeenCalledWith("acme");
  });

  test("fetchUserWorkspaceInfo error: sets loader false and rethrows", async () => {
    const err = new Error("fail ws");
    wsService.workspaceMemberMe.mockRejectedValue(err);
    await expect(store.fetchUserWorkspaceInfo("acme")).rejects.toThrow("fail ws");
    expect(store.loader).toBe(false);
  });

  test("leaveWorkspace succeeds and unsets related maps", async () => {
    // seed data
    store.workspaceUserInfo["acme"] = { id: "me", role: EUserWorkspaceRoles.MEMBER } as any;
    store.projectUserInfo["acme"] = { prj1: { id: "mem", role: EUserProjectRoles.MEMBER } as any };
    store.workspaceProjectsPermissions["acme"] = { prj1: EUserPermissions.MEMBER };
    (userService.leaveWorkspace as jest.Mock).mockResolvedValue(undefined);

    await store.leaveWorkspace("acme");

    expect(store.workspaceUserInfo["acme"]).toBeUndefined();
    expect(store.projectUserInfo["acme"]).toBeUndefined();
    expect(store.workspaceProjectsPermissions["acme"]).toBeUndefined();
    expect(userService.leaveWorkspace).toHaveBeenCalledWith("acme");
  });

  test("leaveWorkspace error bubbles", async () => {
    (userService.leaveWorkspace as jest.Mock).mockRejectedValue(new Error("cannot leave"));
    await expect(store.leaveWorkspace("acme")).rejects.toThrow("cannot leave");
  });

  test("fetchUserProjectInfo stores membership and permissions", async () => {
    const membership: TProjectMembership = { id: "mem1", role: EUserPermissions.MEMBER } as any;
    (projectMemberService.projectMemberMe as jest.Mock).mockResolvedValue(membership);

    const res = await store.fetchUserProjectInfo("acme", "prj1");
    expect(res).toBe(membership);
    expect(store.projectUserInfo["acme"]["prj1"]).toEqual(membership);
    expect(store.workspaceProjectsPermissions["acme"]["prj1"]).toBe(EUserPermissions.MEMBER);
    expect(projectMemberService.projectMemberMe).toHaveBeenCalledWith("acme", "prj1");
  });

  test("fetchUserProjectInfo error bubbles", async () => {
    (projectMemberService.projectMemberMe as jest.Mock).mockRejectedValue(new Error("p fail"));
    await expect(store.fetchUserProjectInfo("acme", "prj1")).rejects.toThrow("p fail");
  });

  test("fetchUserProjectPermissions writes map", async () => {
    const map: IUserProjectsRole = { prj1: EUserPermissions.MEMBER, prj2: EUserPermissions.GUEST };
    wsService.getWorkspaceUserProjectsRole.mockResolvedValue(map);

    const res = await store.fetchUserProjectPermissions("acme");
    expect(res).toBe(map);
    expect(store.workspaceProjectsPermissions["acme"]).toEqual(map);
    expect(wsService.getWorkspaceUserProjectsRole).toHaveBeenCalledWith("acme");
  });

  test("fetchUserProjectPermissions error bubbles", async () => {
    wsService.getWorkspaceUserProjectsRole.mockRejectedValue(new Error("perm fail"));
    await expect(store.fetchUserProjectPermissions("acme")).rejects.toThrow("perm fail");
  });

  test("joinProject uses workspace role or defaults to MEMBER, then sets permission", async () => {
    (userService.joinProject as jest.Mock).mockResolvedValue({ ok: true });
    // case 1: has workspace role ADMIN -> set ADMIN on project
    store.workspaceUserInfo["acme"] = { id: "me", role: EUserPermissions.ADMIN as any } as any;
    await store.joinProject("acme", "prjA");
    expect(store.workspaceProjectsPermissions["acme"]["prjA"]).toBe(EUserPermissions.ADMIN);

    // case 2: no workspace role -> defaults to MEMBER
    delete store.workspaceUserInfo["acme"];
    await store.joinProject("acme", "prjB");
    expect(store.workspaceProjectsPermissions["acme"]["prjB"]).toBe(EUserPermissions.MEMBER);
    expect(userService.joinProject).toHaveBeenCalledWith("acme", ["prjB"]);
  });

  test("joinProject error bubbles", async () => {
    (userService.joinProject as jest.Mock).mockRejectedValue(new Error("join fail"));
    await expect(store.joinProject("acme", "x")).rejects.toThrow("join fail");
  });

  test("leaveProject unsets permissions, membership, and projectMap", async () => {
    (userService.leaveProject as jest.Mock).mockResolvedValue(undefined);
    // seed
    store.workspaceProjectsPermissions["acme"] = { prj1: EUserPermissions.MEMBER };
    store.projectUserInfo["acme"] = { prj1: { id: "mem", role: EUserPermissions.MEMBER } as any };
    const rs: any = (store as any).store;
    rs.projectRoot.project.projectMap["prj1"] = { id: "prj1" };

    await store.leaveProject("acme", "prj1");

    expect(store.workspaceProjectsPermissions["acme"]["prj1"]).toBeUndefined();
    expect(store.projectUserInfo["acme"]["prj1"]).toBeUndefined();
    expect(rs.projectRoot.project.projectMap["prj1"]).toBeUndefined();
    expect(userService.leaveProject).toHaveBeenCalledWith("acme", "prj1");
  });

  test("leaveProject error bubbles", async () => {
    (userService.leaveProject as jest.Mock).mockRejectedValue(new Error("leave fail"));
    await expect(store.leaveProject("acme", "prjZ")).rejects.toThrow("leave fail");
  });
});