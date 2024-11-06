import set from "lodash/set";
import unset from "lodash/unset";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { IProjectMember, IUserProjectsRole, IWorkspaceMemberMe } from "@plane/types";
// plane web types
import {
  EUserPermissions,
  EUserPermissionsLevel,
  TUserPermissions,
  TUserPermissionsLevel,
} from "@/plane-web/constants/user-permissions";
// plane web services
import { WorkspaceService } from "@/plane-web/services/workspace.service";
// services
import projectMemberService from "@/services/project/project-member.service";
import userService from "@/services/user.service";
// store
import { CoreRootStore } from "@/store/root.store";

// derived services
const workspaceService = new WorkspaceService();

export interface IUserPermissionStore {
  loader: boolean;
  // observables
  workspaceUserInfo: Record<string, IWorkspaceMemberMe>; // workspaceSlug -> IWorkspaceMemberMe
  projectUserInfo: Record<string, Record<string, IProjectMember>>; // workspaceSlug -> projectId -> IProjectMember
  workspaceProjectsPermissions: Record<string, IUserProjectsRole>; // workspaceSlug -> IUserProjectsRole
  // computed
  // computed helpers
  workspaceInfoBySlug: (workspaceSlug: string) => IWorkspaceMemberMe | undefined;
  projectPermissionsByWorkspaceSlugAndProjectId: (
    workspaceSlug: string,
    projectId: string
  ) => TUserPermissions | undefined;
  allowPermissions: (
    allowPermissions: TUserPermissions[],
    level: TUserPermissionsLevel,
    workspaceSlug?: string,
    projectId?: string,
    onPermissionAllowed?: () => boolean
  ) => boolean;
  // action helpers
  // actions
  fetchUserWorkspaceInfo: (workspaceSlug: string) => Promise<IWorkspaceMemberMe | undefined>;
  leaveWorkspace: (workspaceSlug: string) => Promise<void>;
  fetchUserProjectInfo: (workspaceSlug: string, projectId: string) => Promise<IProjectMember | undefined>;
  fetchUserProjectPermissions: (workspaceSlug: string) => Promise<IUserProjectsRole | undefined>;
  joinProject: (workspaceSlug: string, projectId: string) => Promise<void | undefined>;
  leaveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class UserPermissionStore implements IUserPermissionStore {
  loader: boolean = false;
  // constants
  workspaceUserInfo: Record<string, IWorkspaceMemberMe> = {};
  projectUserInfo: Record<string, Record<string, IProjectMember>> = {};
  workspaceProjectsPermissions: Record<string, IUserProjectsRole> = {};
  // observables

  constructor(private store: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      workspaceUserInfo: observable,
      projectUserInfo: observable,
      workspaceProjectsPermissions: observable,
      // computed
      // actions
      fetchUserWorkspaceInfo: action,
      leaveWorkspace: action,
      fetchUserProjectInfo: action,
      fetchUserProjectPermissions: action,
      joinProject: action,
      leaveProject: action,
    });
  }

  // computed

  // computed helpers
  /**
   * @description Returns the current workspace information
   * @param { string } workspaceSlug
   * @returns { IWorkspaceMemberMe | undefined }
   */
  workspaceInfoBySlug = computedFn((workspaceSlug: string): IWorkspaceMemberMe | undefined => {
    if (!workspaceSlug) return undefined;
    return this.workspaceUserInfo[workspaceSlug] || undefined;
  });

  /**
   * @description Returns the current project permissions
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { IUserProjectsRole | undefined }
   */
  projectPermissionsByWorkspaceSlugAndProjectId = computedFn(
    (workspaceSlug: string, projectId: string): TUserPermissions | undefined => {
      if (!workspaceSlug || !projectId) return undefined;
      return this.workspaceProjectsPermissions?.[workspaceSlug]?.[projectId] || undefined;
    }
  );

  // action helpers
  /**
   * @description Returns whether the user has the permission to perform an action
   * @param { TUserPermissions[] } allowPermissions
   * @param { TUserPermissionsLevel } level
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { () => boolean } onPermissionAllowed
   * @returns { boolean }
   */
  allowPermissions = (
    allowPermissions: TUserPermissions[],
    level: TUserPermissionsLevel,
    workspaceSlug?: string,
    projectId?: string,
    onPermissionAllowed?: () => boolean
  ): boolean => {
    const { workspaceSlug: currentWorkspaceSlug, projectId: currentProjectId } = this.store.router;
    if (!workspaceSlug) workspaceSlug = currentWorkspaceSlug;
    if (!projectId) projectId = currentProjectId;

    let currentUserRole: TUserPermissions | undefined = undefined;

    if (level === EUserPermissionsLevel.WORKSPACE) {
      const workspaceInfoBySlug = workspaceSlug && this.workspaceInfoBySlug(workspaceSlug);
      if (workspaceInfoBySlug) {
        currentUserRole = workspaceInfoBySlug?.role as unknown as EUserPermissions;
      }
    }

    if (level === EUserPermissionsLevel.PROJECT) {
      currentUserRole = (workspaceSlug &&
        projectId &&
        this.projectPermissionsByWorkspaceSlugAndProjectId(workspaceSlug, projectId)) as EUserPermissions | undefined;
    }

    if (currentUserRole && allowPermissions.includes(currentUserRole)) {
      if (onPermissionAllowed) {
        return onPermissionAllowed();
      } else {
        return true;
      }
    }

    return false;
  };

  // actions
  /**
   * @description Fetches the user's workspace information
   * @param { string } workspaceSlug
   * @returns { Promise<void | undefined> }
   */
  fetchUserWorkspaceInfo = async (workspaceSlug: string): Promise<IWorkspaceMemberMe | undefined> => {
    try {
      this.loader = true;
      const response = await workspaceService.workspaceMemberMe(workspaceSlug);
      if (response) {
        runInAction(() => {
          set(this.workspaceUserInfo, [workspaceSlug], response);
          this.loader = false;
        });
      }
      return response;
    } catch (error) {
      console.error("Error fetching user workspace information", error);
      this.loader = false;
      throw error;
    }
  };

  /**
   * @description Leaves a workspace
   * @param { string } workspaceSlug
   * @returns { Promise<void | undefined> }
   */
  leaveWorkspace = async (workspaceSlug: string): Promise<void> => {
    try {
      await userService.leaveWorkspace(workspaceSlug);
      runInAction(() => {
        unset(this.workspaceUserInfo, workspaceSlug);
        unset(this.projectUserInfo, workspaceSlug);
        unset(this.workspaceProjectsPermissions, workspaceSlug);
      });
    } catch (error) {
      console.error("Error user leaving the workspace", error);
      throw error;
    }
  };

  /**
   * @description Fetches the user's project information
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { Promise<void | undefined> }
   */
  fetchUserProjectInfo = async (workspaceSlug: string, projectId: string): Promise<IProjectMember | undefined> => {
    try {
      const response = await projectMemberService.projectMemberMe(workspaceSlug, projectId);
      if (response) {
        runInAction(() => {
          set(this.projectUserInfo, [workspaceSlug, projectId], response);
          set(this.workspaceProjectsPermissions, [workspaceSlug, projectId], response.role);
        });
      }
      return response;
    } catch (error) {
      console.error("Error fetching user project information", error);
      throw error;
    }
  };

  /**
   * @description Fetches the user's project permissions
   * @param { string } workspaceSlug
   * @returns { Promise<void | undefined> }
   */
  fetchUserProjectPermissions = async (workspaceSlug: string): Promise<IUserProjectsRole | undefined> => {
    try {
      const response = await workspaceService.getWorkspaceUserProjectsRole(workspaceSlug);
      runInAction(() => {
        set(this.workspaceProjectsPermissions, [workspaceSlug], response);
      });
      return response;
    } catch (error) {
      console.error("Error fetching user project permissions", error);
      throw error;
    }
  };

  /**
   * @description Joins a project
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { Promise<void | undefined> }
   */
  joinProject = async (workspaceSlug: string, projectId: string): Promise<void | undefined> => {
    try {
      const response = await userService.joinProject(workspaceSlug, [projectId]);
      const projectMemberRole = this.workspaceInfoBySlug(workspaceSlug)?.role ?? EUserPermissions.MEMBER;
      if (response) {
        runInAction(() => {
          set(this.workspaceProjectsPermissions, [workspaceSlug, projectId], projectMemberRole);
        });
      }
      return response;
    } catch (error) {
      console.error("Error user joining the project", error);
      throw error;
    }
  };

  /**
   * @description Leaves a project
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { Promise<void | undefined> }
   */
  leaveProject = async (workspaceSlug: string, projectId: string): Promise<void> => {
    try {
      await userService.leaveProject(workspaceSlug, projectId);
      runInAction(() => {
        unset(this.workspaceProjectsPermissions, [workspaceSlug, projectId]);
        unset(this.projectUserInfo, [workspaceSlug, projectId]);
        unset(this.store.projectRoot.project.projectMap, [projectId]);
      });
    } catch (error) {
      console.error("Error user leaving the project", error);
      throw error;
    }
  };
}
