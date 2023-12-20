import { action, observable, runInAction, makeObservable, computed } from "mobx";
import { set } from "lodash";
// services
import { ProjectMemberService } from "services/project";
import { UserService } from "services/user.service";
import { WorkspaceService } from "services/workspace.service";
// interfaces
import { IWorkspaceMemberMe, IProjectMember, IUserProjectsRole } from "types";
import { RootStore } from "../root.store";
// constants
import { EUserProjectRoles } from "constants/project";
import { EUserWorkspaceRoles } from "constants/workspace";

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

  hasPermissionToCurrentWorkspace: boolean | undefined;
  hasPermissionToCurrentProject: boolean | undefined;
  // actions
  fetchUserWorkspaceInfo: (workspaceSlug: string) => Promise<IWorkspaceMemberMe>;
  fetchUserProjectInfo: (workspaceSlug: string, projectId: string) => Promise<IProjectMember>;

  leaveWorkspace: (workspaceSlug: string) => Promise<void>;
  joinProject: (workspaceSlug: string, projectIds: string[]) => Promise<any>;
  leaveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchUserWorkspaceProjectsRole: (workspaceSlug: string) => Promise<IUserProjectsRole>;
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
  // services
  userService;
  workspaceService;
  projectMemberService;

  constructor(_rootStore: RootStore) {
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
    this.router = _rootStore.app.router;
    // services
    this.userService = new UserService();
    this.workspaceService = new WorkspaceService();
    this.projectMemberService = new ProjectMemberService();
  }

  get currentWorkspaceMemberInfo() {
    if (!this.router.workspaceSlug) return;
    return this.workspaceMemberInfo[this.router.workspaceSlug];
  }

  get currentWorkspaceRole() {
    if (!this.router.workspaceSlug) return;
    return this.workspaceMemberInfo[this.router.workspaceSlug]?.role;
  }

  get currentProjectMemberInfo() {
    if (!this.router.projectId) return;
    return this.projectMemberInfo[this.router.projectId];
  }

  get currentProjectRole() {
    if (!this.router.projectId) return;
    return this.projectMemberInfo[this.router.projectId]?.role;
  }

  get currentWorkspaceAllProjectsRole() {
    if (!this.router.workspaceSlug) return;
    return this.workspaceProjectsRole?.[this.router.workspaceSlug];
  }

  get hasPermissionToCurrentWorkspace() {
    if (!this.router.workspaceSlug) return;
    return this.hasPermissionToWorkspace[this.router.workspaceSlug];
  }

  get hasPermissionToCurrentProject() {
    if (!this.router.projectId) return;
    return this.hasPermissionToProject[this.router.projectId];
  }

  fetchUserWorkspaceInfo = async (workspaceSlug: string) => {
    try {
      const response = await this.workspaceService.workspaceMemberMe(workspaceSlug);

      runInAction(() => {
        set(this.workspaceMemberInfo, [workspaceSlug], response);
        set(this.hasPermissionToWorkspace, [workspaceSlug], true);
      });

      // console.log("this.workspaceMemberInfo", this.workspaceMemberInfo);
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.hasPermissionToWorkspace, [workspaceSlug], false);
      });
      throw error;
    }
  };

  fetchUserProjectInfo = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectMemberService.projectMemberMe(workspaceSlug, projectId);

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
    } catch (error: any) {
      runInAction(() => {
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          [projectId]: false,
        };
      });

      throw error;
    }
  };

  leaveWorkspace = async (workspaceSlug: string) => {
    try {
      await this.userService.leaveWorkspace(workspaceSlug);

      runInAction(() => {
        delete this.workspaceMemberInfo[workspaceSlug];
        delete this.hasPermissionToWorkspace[workspaceSlug];
      });
    } catch (error) {
      throw error;
    }
  };

  joinProject = async (workspaceSlug: string, projectIds: string[]) => {
    const newPermissions: { [projectId: string]: boolean } = {};
    projectIds.forEach((projectId) => {
      newPermissions[projectId] = true;
    });

    try {
      const response = await this.userService.joinProject(workspaceSlug, projectIds);

      runInAction(() => {
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          ...newPermissions,
        };
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  leaveProject = async (workspaceSlug: string, projectId: string) => {
    const newPermissions: { [projectId: string]: boolean } = {};
    newPermissions[projectId] = false;

    try {
      await this.userService.leaveProject(workspaceSlug, projectId);

      runInAction(() => {
        this.hasPermissionToProject = {
          ...this.hasPermissionToProject,
          ...newPermissions,
        };
      });
    } catch (error) {
      throw error;
    }
  };

  fetchUserWorkspaceProjectsRole = async (workspaceSlug: string) => {
    try {
      const response = await this.workspaceService.getWorkspaceUserProjectsRole(workspaceSlug);

      runInAction(() => {
        set(this.workspaceProjectsRole, [workspaceSlug], response);
      });
      return response;
    } catch (error) {
      throw error;
    }
  };
}
