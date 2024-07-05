import { set } from "lodash";
import { action, observable, runInAction, makeObservable, computed } from "mobx";
// types
import { IWorkspaceMemberMe, IProjectMember, IUserProjectsRole } from "@plane/types";
// constants
import { EUserProjectRoles } from "@/constants/project";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// services
import { WorkspaceService } from "@/plane-web/services";
import { ProjectMemberService } from "@/services/project";
import { UserService } from "@/services/user.service";
// plane web store
import { CoreRootStore } from "../root.store";

export interface IUserMembershipStore {
  // observables
  workspaceMemberInfo: {
    [workspaceSlug: string]: IWorkspaceMemberMe;
  };
  hasPermissionToWorkspace: {
    [workspaceSlug: string]: boolean | null;
  };
  projectMemberInfo: {
    [projectId: string]: IProjectMember;
  };
  hasPermissionToProject: {
    [projectId: string]: boolean | null;
  };
  workspaceProjectsRole: { [workspaceSlug: string]: IUserProjectsRole };
  // computed
  currentProjectMemberInfo: IProjectMember | undefined;
  currentWorkspaceMemberInfo: IWorkspaceMemberMe | undefined;
  currentProjectRole: EUserProjectRoles | undefined;
  currentWorkspaceRole: EUserWorkspaceRoles | undefined;
  currentWorkspaceAllProjectsRole: IUserProjectsRole | undefined;

  // computed functions
  currentProjectRoleByProjectId: (projectId: string) => EUserProjectRoles | undefined;

  hasPermissionToCurrentWorkspace: boolean | undefined;
  hasPermissionToCurrentProject: boolean | undefined;
  // fetch actions
  fetchUserWorkspaceInfo: (workspaceSlug: string) => Promise<IWorkspaceMemberMe>;
  fetchUserProjectInfo: (workspaceSlug: string, projectId: string) => Promise<IProjectMember>;
  fetchUserWorkspaceProjectsRole: (workspaceSlug: string) => Promise<IUserProjectsRole>;
  // crud actions
  leaveWorkspace: (workspaceSlug: string) => Promise<void>;
  joinProject: (workspaceSlug: string, projectIds: string[]) => Promise<any>;
  leaveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class UserMembershipStore implements IUserMembershipStore {
  workspaceMemberInfo: {
    [workspaceSlug: string]: IWorkspaceMemberMe;
  } = {};
  hasPermissionToWorkspace: {
    [workspaceSlug: string]: boolean;
  } = {};
  projectMemberInfo: {
    [projectId: string]: IProjectMember;
  } = {};
  hasPermissionToProject: {
    [projectId: string]: boolean;
  } = {};
  workspaceProjectsRole: { [workspaceSlug: string]: IUserProjectsRole } = {};
  // stores
  router;
  store;
  // services
  userService;
  workspaceService;
  projectMemberService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      workspaceMemberInfo: observable,
      hasPermissionToWorkspace: observable,
      projectMemberInfo: observable,
      hasPermissionToProject: observable,
      workspaceProjectsRole: observable,
      // computed
      currentWorkspaceMemberInfo: computed,
      currentWorkspaceRole: computed,
      currentProjectMemberInfo: computed,
      currentProjectRole: computed,
      currentWorkspaceAllProjectsRole: computed,
      hasPermissionToCurrentWorkspace: computed,
      hasPermissionToCurrentProject: computed,
      // actions
      fetchUserWorkspaceInfo: action,
      fetchUserProjectInfo: action,
      leaveWorkspace: action,
      joinProject: action,
      leaveProject: action,
      fetchUserWorkspaceProjectsRole: action,
    });
    this.router = _rootStore.router;
    this.store = _rootStore;
    // services
    this.userService = new UserService();
    this.workspaceService = new WorkspaceService();
    this.projectMemberService = new ProjectMemberService();
  }

  /**
   * Returns the current workspace member info
   */
  get currentWorkspaceMemberInfo() {
    if (!this.router.workspaceSlug) return;
    return this.workspaceMemberInfo[this.router.workspaceSlug];
  }

  /**
   * Returns the current workspace role
   */
  get currentWorkspaceRole() {
    if (!this.router.workspaceSlug) return;
    return this.workspaceMemberInfo[this.router.workspaceSlug]?.role;
  }

  /**
   * Returns the current project member info
   */
  get currentProjectMemberInfo() {
    if (!this.router.projectId) return;
    return this.projectMemberInfo[this.router.projectId];
  }

  /**
   * Returns the current project role
   */
  get currentProjectRole() {
    if (!this.router.projectId) return;
    return this.projectMemberInfo[this.router.projectId]?.role;
  }

  /**
   * Returns all projects role for the current workspace
   */
  get currentWorkspaceAllProjectsRole() {
    if (!this.router.workspaceSlug) return;
    return this.workspaceProjectsRole?.[this.router.workspaceSlug];
  }

  /**
   * Returns if the user has permission to the current workspace
   */
  get hasPermissionToCurrentWorkspace() {
    if (!this.router.workspaceSlug) return;
    return this.hasPermissionToWorkspace[this.router.workspaceSlug];
  }

  /**
   * Returns if the user has permission to the current project
   */
  get hasPermissionToCurrentProject() {
    if (!this.router.projectId) return;
    return this.hasPermissionToProject[this.router.projectId];
  }

  // computed functions
  /**
   * Returns the current project role by project id
   * @param projectId
   * @returns EUserProjectRoles
   */
  currentProjectRoleByProjectId = (projectId: string) => this.projectMemberInfo[projectId]?.role || undefined;

  /**
   * Fetches the current user workspace info
   * @param workspaceSlug
   * @returns Promise<IWorkspaceMemberMe>
   */
  fetchUserWorkspaceInfo = async (workspaceSlug: string) =>
    await this.workspaceService.workspaceMemberMe(workspaceSlug).then((response) => {
      runInAction(() => {
        set(this.workspaceMemberInfo, [workspaceSlug], response);
        set(this.hasPermissionToWorkspace, [workspaceSlug], true);
      });
      return response;
    });

  /**
   * Fetches the current user project info
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IProjectMember>
   */
  fetchUserProjectInfo = async (workspaceSlug: string, projectId: string) =>
    await this.projectMemberService.projectMemberMe(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        this.projectMemberInfo = {
          ...this.projectMemberInfo,
          [projectId]: response,
        };
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          [projectId]: true,
        };
      });
      return response;
    });

  /**
   * Leaves a workspace
   * @param workspaceSlug
   * @returns Promise<void>
   */
  leaveWorkspace = async (workspaceSlug: string) => {
    const currentWorksSpace = this.store.workspaceRoot?.currentWorkspace;
    await this.userService.leaveWorkspace(workspaceSlug).then(() => {
      runInAction(() => {
        if (currentWorksSpace) delete this.store.workspaceRoot?.workspaces?.[currentWorksSpace?.id];
        delete this.workspaceMemberInfo[workspaceSlug];
        delete this.hasPermissionToWorkspace[workspaceSlug];
      });
    });
  };

  /**
   * Joins a project
   * @param workspaceSlug
   * @param projectIds
   * @returns Promise<void>
   */
  joinProject = async (workspaceSlug: string, projectIds: string[]) =>
    await this.userService.joinProject(workspaceSlug, projectIds).then(() => {
      const newPermissions: { [projectId: string]: boolean } = {};
      projectIds.forEach((projectId) => {
        newPermissions[projectId] = true;
      });
      runInAction(() => {
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          ...newPermissions,
        };
      });
    });

  /**
   * Leaves a project
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<void>
   */
  leaveProject = async (workspaceSlug: string, projectId: string) =>
    await this.userService.leaveProject(workspaceSlug, projectId).then(() => {
      const newPermissions: { [projectId: string]: boolean } = {};
      newPermissions[projectId] = false;
      runInAction(() => {
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          ...newPermissions,
        };
      });
    });

  /**
   * Fetches the current user workspace projects role
   * @param workspaceSlug
   * @returns Promise<IUserProjectsRole>
   */
  fetchUserWorkspaceProjectsRole = async (workspaceSlug: string) =>
    await this.workspaceService.getWorkspaceUserProjectsRole(workspaceSlug).then((response) => {
      runInAction(() => {
        set(this.workspaceProjectsRole, [workspaceSlug], response);
      });
      return response;
    });
}
