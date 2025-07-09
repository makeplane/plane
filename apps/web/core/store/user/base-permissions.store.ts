import set from "lodash/set";
import unset from "lodash/unset";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import {
  EUserPermissions,
  EUserPermissionsLevel,
  TUserPermissions,
  TUserPermissionsLevel,
  WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS,
} from "@plane/constants";
import {
  EUserProjectRoles,
  EUserWorkspaceRoles,
  IUserProjectsRole,
  IWorkspaceMemberMe,
  TProjectMembership,
} from "@plane/types";
// plane web imports
import { WorkspaceService } from "@/plane-web/services/workspace.service";
import { RootStore } from "@/plane-web/store/root.store";
// services
import projectMemberService from "@/services/project/project-member.service";
import userService from "@/services/user.service";

// derived services
const workspaceService = new WorkspaceService();

type ETempUserRole = TUserPermissions | EUserWorkspaceRoles | EUserProjectRoles; // TODO: Remove this once we have migrated user permissions to enums to plane constants package

export interface IBaseUserPermissionStore {
  loader: boolean;
  // observables
  workspaceUserInfo: Record<string, IWorkspaceMemberMe>; // workspaceSlug -> IWorkspaceMemberMe
  projectUserInfo: Record<string, Record<string, TProjectMembership>>; // workspaceSlug -> projectId -> TProjectMembership
  workspaceProjectsPermissions: Record<string, IUserProjectsRole>; // workspaceSlug -> IUserProjectsRole
  // computed helpers
  workspaceInfoBySlug: (workspaceSlug: string) => IWorkspaceMemberMe | undefined;
  getWorkspaceRoleByWorkspaceSlug: (workspaceSlug: string) => TUserPermissions | EUserWorkspaceRoles | undefined;
  getProjectRolesByWorkspaceSlug: (workspaceSlug: string) => IUserProjectsRole;
  getProjectRoleByWorkspaceSlugAndProjectId: (workspaceSlug: string, projectId: string) => EUserPermissions | undefined;
  allowPermissions: (
    allowPermissions: ETempUserRole[],
    level: TUserPermissionsLevel,
    workspaceSlug?: string,
    projectId?: string,
    onPermissionAllowed?: () => boolean
  ) => boolean;
  // actions
  fetchUserWorkspaceInfo: (workspaceSlug: string) => Promise<IWorkspaceMemberMe>;
  leaveWorkspace: (workspaceSlug: string) => Promise<void>;
  fetchUserProjectInfo: (workspaceSlug: string, projectId: string) => Promise<TProjectMembership>;
  fetchUserProjectPermissions: (workspaceSlug: string) => Promise<IUserProjectsRole>;
  joinProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  leaveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  hasPageAccess: (workspaceSlug: string, key: string) => boolean;
}

/**
 * @description This store is used to handle permission layer for the currently logged user.
 * It manages workspace and project level permissions, roles and access control.
 */
export abstract class BaseUserPermissionStore implements IBaseUserPermissionStore {
  loader: boolean = false;
  // constants
  workspaceUserInfo: Record<string, IWorkspaceMemberMe> = {};
  projectUserInfo: Record<string, Record<string, TProjectMembership>> = {};
  workspaceProjectsPermissions: Record<string, IUserProjectsRole> = {};
  // observables

  constructor(protected store: RootStore) {
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
   * @description Returns the workspace role by slug
   * @param { string } workspaceSlug
   * @returns { TUserPermissions | EUserWorkspaceRoles | undefined }
   */
  getWorkspaceRoleByWorkspaceSlug = computedFn(
    (workspaceSlug: string): TUserPermissions | EUserWorkspaceRoles | undefined => {
      if (!workspaceSlug) return undefined;
      return this.workspaceUserInfo[workspaceSlug]?.role as TUserPermissions | EUserWorkspaceRoles | undefined;
    }
  );

  /**
   * @description Returns the project membership permission
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { EUserPermissions | undefined }
   */
  protected getProjectRole = computedFn((workspaceSlug: string, projectId: string): EUserPermissions | undefined => {
    if (!workspaceSlug || !projectId) return undefined;
    return this.workspaceProjectsPermissions?.[workspaceSlug]?.[projectId] || undefined;
  });

  /**
   * @description Returns the project permissions by workspace slug
   * @param { string } workspaceSlug
   * @returns { IUserProjectsRole }
   */
  getProjectRolesByWorkspaceSlug = computedFn((workspaceSlug: string): IUserProjectsRole => {
    const projectPermissions = this.workspaceProjectsPermissions[workspaceSlug] || {};
    return Object.keys(projectPermissions).reduce((acc, projectId) => {
      const projectRole = this.getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
      if (projectRole) {
        acc[projectId] = projectRole;
      }
      return acc;
    }, {} as IUserProjectsRole);
  });

  /**
   * @description Returns the current project permissions
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { EUserPermissions | undefined }
   */
  abstract getProjectRoleByWorkspaceSlugAndProjectId: (
    workspaceSlug: string,
    projectId: string
  ) => EUserPermissions | undefined;

  /**
   * @description Returns whether the user has the permission to access a page
   * @param { string } page
   * @returns { boolean }
   */
  hasPageAccess = computedFn((workspaceSlug: string, key: string): boolean => {
    if (!workspaceSlug || !key) return false;
    const settings = WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS.find((item) => item.key === key);
    if (settings) {
      return this.allowPermissions(settings.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug);
    }
    return false;
  });

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
    allowPermissions: ETempUserRole[],
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
      currentUserRole = (workspaceSlug && this.getWorkspaceRoleByWorkspaceSlug(workspaceSlug)) as
        | EUserPermissions
        | undefined;
    }

    if (level === EUserPermissionsLevel.PROJECT) {
      currentUserRole = (workspaceSlug &&
        projectId &&
        this.getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId)) as EUserPermissions | undefined;
    }

    if (typeof currentUserRole === "string") {
      currentUserRole = parseInt(currentUserRole);
    }

    if (currentUserRole && typeof currentUserRole === "number" && allowPermissions.includes(currentUserRole)) {
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
   * @returns { Promise<IWorkspaceMemberMe | undefined> }
   */
  fetchUserWorkspaceInfo = async (workspaceSlug: string): Promise<IWorkspaceMemberMe> => {
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
   * @returns { Promise<TProjectMembership | undefined> }
   */
  fetchUserProjectInfo = async (workspaceSlug: string, projectId: string): Promise<TProjectMembership> => {
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
   * @returns { Promise<IUserProjectsRole | undefined> }
   */
  fetchUserProjectPermissions = async (workspaceSlug: string): Promise<IUserProjectsRole> => {
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
   * @returns { Promise<void> }
   */
  joinProject = async (workspaceSlug: string, projectId: string): Promise<void> => {
    try {
      const response = await userService.joinProject(workspaceSlug, [projectId]);
      const projectMemberRole = this.getWorkspaceRoleByWorkspaceSlug(workspaceSlug) ?? EUserPermissions.MEMBER;
      if (response) {
        runInAction(() => {
          set(this.workspaceProjectsPermissions, [workspaceSlug, projectId], projectMemberRole);
        });
      }
    } catch (error) {
      console.error("Error user joining the project", error);
      throw error;
    }
  };

  /**
   * @description Leaves a project
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { Promise<void> }
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
