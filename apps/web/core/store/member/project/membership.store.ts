/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { uniq, unset, set, update, sortBy } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import type {
  IProjectBulkAddFormData,
  IProjectUserPropertiesResponse,
  IUserLite,
  TProjectMembership,
} from "@plane/types";
import { isGuestRole } from "@plane/utils";
// plane web imports
import type { RootStore } from "@/plane-web/store/root.store";
// services
import { ProjectMemberService, ProjectService } from "@/services/project";
// store
import type { IProjectStore } from "@/store/project/project.store";
import type { IRouterStore } from "@/store/router.store";
import type { IUserStore } from "@/store/user";
// local imports
import type { IMemberRootStore } from "../index";
import { sortProjectMembers } from "../utils";
import type { IProjectMemberFiltersStore } from "./filters.store";
import { ProjectMemberFiltersStore } from "./filters.store";

export interface IProjectMemberDetails {
  id: string;
  role_slug: string;
  member: IUserLite;
  created_at: string;
}

export interface IProjectMemberStore {
  // observables
  projectMemberFetchStatusMap: {
    [projectId: string]: boolean;
  };
  projectMemberMap: {
    [projectId: string]: Record<string, TProjectMembership>;
  };
  projectUserPropertiesMap: {
    [projectId: string]: IProjectUserPropertiesResponse;
  };
  // filters store
  filters: IProjectMemberFiltersStore;
  // computed
  projectMemberIds: string[] | null;
  // computed actions
  getProjectMemberFetchStatus: (projectId: string) => boolean;
  getProjectMemberDetails: (userId: string, projectId: string) => IProjectMemberDetails | null;
  getProjectMemberIds: (projectId: string, includeGuestUsers: boolean) => string[] | null;
  getFilteredProjectMemberDetails: (userId: string, projectId: string) => IProjectMemberDetails | null;
  getProjectUserProperties: (projectId: string) => IProjectUserPropertiesResponse | null;
  // fetch actions
  fetchProjectMembers: (
    workspaceSlug: string,
    projectId: string,
    clearExistingMembers?: boolean
  ) => Promise<TProjectMembership[]>;
  fetchProjectUserProperties: (workspaceSlug: string, projectId: string) => Promise<IProjectUserPropertiesResponse>;
  // update actions
  updateProjectUserProperties: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<IProjectUserPropertiesResponse>
  ) => Promise<IProjectUserPropertiesResponse>;
  // bulk operation actions
  bulkAddMembersToProject: (
    workspaceSlug: string,
    projectId: string,
    data: IProjectBulkAddFormData
  ) => Promise<TProjectMembership[]>;
  // crud actions
  updateMemberRole: (
    workspaceSlug: string,
    projectId: string,
    userId: string,
    data: { role_slug: string }
  ) => Promise<TProjectMembership>;
  removeMemberFromProject: (workspaceSlug: string, projectId: string, userId: string) => Promise<void>;
  joinProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  leaveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class ProjectMemberStore implements IProjectMemberStore {
  // observables
  projectMemberFetchStatusMap: {
    [projectId: string]: boolean;
  } = {};
  projectMemberMap: {
    [projectId: string]: Record<string, TProjectMembership>;
  } = {};
  projectUserPropertiesMap: {
    [projectId: string]: IProjectUserPropertiesResponse;
  } = {};
  // filters store
  filters: IProjectMemberFiltersStore;
  // stores
  routerStore: IRouterStore;
  userStore: IUserStore;
  memberRoot: IMemberRootStore;
  projectRoot: IProjectStore;
  rootStore: RootStore;
  // services
  projectMemberService;
  projectService;

  constructor(_memberRoot: IMemberRootStore, _rootStore: RootStore) {
    makeObservable(this, {
      // observables
      projectMemberMap: observable,
      projectUserPropertiesMap: observable,
      // computed
      projectMemberIds: computed,
      // actions
      fetchProjectMembers: action,
      fetchProjectUserProperties: action,
      updateProjectUserProperties: action,
      bulkAddMembersToProject: action,
      updateMemberRole: action,
      removeMemberFromProject: action,
    });
    // root store
    this.rootStore = _rootStore;
    this.routerStore = _rootStore.router;
    this.userStore = _rootStore.user;
    this.memberRoot = _memberRoot;
    this.projectRoot = _rootStore.projectRoot.project;
    this.filters = new ProjectMemberFiltersStore();
    // services
    this.projectMemberService = new ProjectMemberService();
    this.projectService = new ProjectService();
  }

  /**
   * @description get the list of all the user ids of all the members of the current project
   * Returns filtered and sorted member IDs based on current filters
   */
  get projectMemberIds() {
    const projectId = this.routerStore.projectId;
    if (!projectId) return null;

    const members = Object.values(this.projectMemberMap?.[projectId] ?? {});
    if (members.length === 0) return null;

    // Access the filters directly to ensure MobX tracking
    const currentFilters = this.filters.filtersMap[projectId];

    // Apply filters and sorting directly here to ensure MobX tracking
    const sortedMembers = sortProjectMembers(
      members,
      this.memberRoot.getUserDetails,
      (member) => member.member,
      currentFilters
    );

    return sortedMembers.map((member) => member.member);
  }

  /**
   * @description get the fetch status of a project member
   * @param projectId
   */
  getProjectMemberFetchStatus = computedFn((projectId: string) => this.projectMemberFetchStatusMap?.[projectId]);

  /**
   * @description get the project memberships
   * @param projectId
   */
  protected getProjectMemberships = computedFn((projectId: string) =>
    Object.values(this.projectMemberMap?.[projectId] ?? {})
  );

  /**
   * @description get the project membership by user id
   * @param userId
   * @param projectId
   */
  protected getProjectMembershipByUserId = computedFn(
    (userId: string, projectId: string) => this.projectMemberMap?.[projectId]?.[userId]
  );

  /**
   * @description get the role_slug from the project membership
   * @param userId
   * @param projectId
   */
  protected getRoleFromProjectMembership = computedFn((userId: string, projectId: string): string | undefined => {
    const projectMembership = this.getProjectMembershipByUserId(userId, projectId);
    if (!projectMembership) return undefined;
    return projectMembership.role_slug;
  });

  /**
   * @description get the details of a project member
   * @param userId
   * @param projectId
   */
  getProjectMemberDetails = computedFn((userId: string, projectId: string) => {
    const projectMember = this.getProjectMembershipByUserId(userId, projectId);
    const userDetails = this.memberRoot.getUserDetails(projectMember?.member);
    if (!projectMember || !userDetails) return null;
    const memberDetails: IProjectMemberDetails = {
      id: projectMember.id,
      role_slug: projectMember.role_slug,
      member: {
        ...userDetails,
        joining_date: projectMember.created_at ?? undefined,
      },
      created_at: projectMember.created_at,
    };
    return memberDetails;
  });

  /**
   * @description get the list of all the user ids of all the members of a project using projectId
   * @param projectId
   */
  getProjectMemberIds = computedFn((projectId: string, includeGuestUsers: boolean): string[] | null => {
    if (!this.projectMemberMap?.[projectId]) return null;
    let members = this.getProjectMemberships(projectId);
    if (includeGuestUsers === false) {
      members = members.filter((m) => !isGuestRole(m.role_slug));
    }
    members = sortBy(members, [
      (m) => m.member !== this.userStore.data?.id,
      (m) => this.memberRoot.getUserDetails(m.member)?.display_name?.toLowerCase(),
    ]);
    const memberIds = members.map((m) => m.member);
    return memberIds;
  });

  /**
   * @description get the filtered project member details for a specific user
   * @param userId
   * @param projectId
   */
  getFilteredProjectMemberDetails = computedFn((userId: string, projectId: string) => {
    const projectMember = this.getProjectMembershipByUserId(userId, projectId);
    const userDetails = this.memberRoot.getUserDetails(projectMember?.member);
    if (!projectMember || !userDetails) return null;

    // Check if this member passes the current filters
    const allMembers = this.getProjectMemberships(projectId);
    const filteredMemberIds = this.filters.getFilteredMemberIds(
      allMembers,
      this.memberRoot.getUserDetails,
      (member) => member.member,
      projectId
    );

    // Return null if this user doesn't pass the filters
    if (!filteredMemberIds.includes(userId)) return null;

    const memberDetails: IProjectMemberDetails = {
      id: projectMember.id,
      role_slug: projectMember.role_slug,
      member: {
        ...userDetails,
        joining_date: projectMember.created_at ?? undefined,
      },
      created_at: projectMember.created_at,
    };
    return memberDetails;
  });

  /**
   * @description fetch the list of all the members of a project
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectMembers = async (workspaceSlug: string, projectId: string, clearExistingMembers: boolean = false) =>
    await this.projectMemberService.fetchProjectMembers(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        if (clearExistingMembers) {
          unset(this.projectMemberMap, [projectId]);
        }
        response.forEach((member) => {
          set(this.projectMemberMap, [projectId, member.member], member);
        });
        set(this.projectMemberFetchStatusMap, [projectId], true);
      });
      return response;
    });

  /**
   * @description bulk add members to a project
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns Promise<TProjectMembership[]>
   */
  bulkAddMembersToProject = async (workspaceSlug: string, projectId: string, data: IProjectBulkAddFormData) =>
    await this.projectMemberService.bulkAddMembersToProject(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        response.forEach((member) => {
          set(this.projectMemberMap, [projectId, member.member], member);
        });
      });
      update(this.projectRoot.projectMap, [projectId, "members"], (memberIds) =>
        uniq([...memberIds, ...data.members.map((m) => m.member_id)])
      );
      this.projectRoot.projectMap[projectId].members = this.projectRoot.projectMap?.[projectId]?.members?.concat(
        data.members.map((m) => m.member_id)
      );
      void this.mutateProjectMembersActivity(workspaceSlug, projectId);
      return response;
    });

  /**
   * @description update the role of a member in a project
   * @param workspaceSlug
   * @param projectId
   * @param userId
   * @param data
   */
  updateMemberRole = async (workspaceSlug: string, projectId: string, userId: string, data: { role_slug: string }) => {
    const memberDetails = this.getProjectMemberDetails(userId, projectId);
    if (!memberDetails || !memberDetails?.id) throw new Error("Member not found");
    // original data to revert back in case of error
    const membershipBeforeUpdate = { ...this.getProjectMembershipByUserId(userId, projectId) };
    try {
      runInAction(() => {
        set(this.projectMemberMap, [projectId, userId, "role_slug"], data.role_slug);
      });
      const response = await this.projectMemberService.updateProjectMember(
        workspaceSlug,
        projectId,
        memberDetails?.id,
        {
          role_slug: data.role_slug,
        }
      );
      void this.mutateProjectMembersActivity(workspaceSlug, projectId);
      // If the current user's own project role changed, re-fetch their permission
      // grants so the UI reflects the new capabilities without requiring a reload.
      if (userId === this.userStore?.data?.id) {
        void this.rootStore.permissionAccessStore.fetchCurrentUserWorkspacePermissions(workspaceSlug);
      }
      return response;
    } catch (error) {
      // revert back to original members in case of error
      runInAction(() => {
        set(this.projectMemberMap, [projectId, userId, "role_slug"], membershipBeforeUpdate?.role_slug);
      });
      throw error;
    }
  };

  /**
   * @description Handles the removal of a member from a project
   * @param projectId - The ID of the project to remove the member from
   * @param userId - The ID of the user to remove from the project
   */
  protected handleMemberRemoval = (projectId: string, userId: string) => {
    unset(this.projectMemberMap, [projectId, userId]);
    set(
      this.projectRoot.projectMap,
      [projectId, "members"],
      this.projectRoot.projectMap?.[projectId]?.members?.filter((memberId) => memberId !== userId)
    );
  };

  /**
   * @description remove a member from a project
   * @param workspaceSlug
   * @param projectId
   * @param userId
   */
  removeMemberFromProject = async (workspaceSlug: string, projectId: string, userId: string) => {
    const memberDetails = this.getProjectMemberDetails(userId, projectId);
    if (!memberDetails || !memberDetails?.id) throw new Error("Member not found");
    await this.projectMemberService.deleteProjectMember(workspaceSlug, projectId, memberDetails?.id);
    runInAction(() => {
      this.handleMemberRemoval(projectId, userId);
    });
    void this.mutateProjectMembersActivity(workspaceSlug, projectId);
  };

  /**
   * @description Joins a project
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { Promise<void> }
   */
  joinProject = async (workspaceSlug: string, projectId: string): Promise<void> => {
    try {
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = await this.projectMemberService.joinProject(workspaceSlug, [projectId]);
      if (response) {
        void Promise.all([
          this.rootStore.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId),
          this.rootStore.workItemTypeBridge.fetchAll(workspaceSlug, projectId),
        ]);
        // Auto-complete getting started checklist
        void this.rootStore.preferencesRoot.workspace.updateChecklistIfNotDoneAlready(workspaceSlug, "project_joined");
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
      await this.projectMemberService.leaveProject(workspaceSlug, projectId);
      runInAction(() => {
        unset(this.rootStore.projectRoot.project.projectMap, [projectId]);
      });
    } catch (error) {
      console.error("Error user leaving the project", error);
      throw error;
    }
  };

  /**
   * @description get project member preferences
   * @param projectId
   */
  getProjectUserProperties = computedFn(
    (projectId: string): IProjectUserPropertiesResponse | null => this.projectUserPropertiesMap[projectId] || null
  );

  /**
   * @description fetch project member preferences
   * @param workspaceSlug
   * @param projectId
   * @param data
   */
  fetchProjectUserProperties = async (
    workspaceSlug: string,
    projectId: string
  ): Promise<IProjectUserPropertiesResponse> => {
    const response = await this.projectService.getProjectUserProperties(workspaceSlug, projectId);
    runInAction(() => {
      set(this.projectUserPropertiesMap, [projectId], response);
    });
    return response;
  };

  /**
   * @description update project member preferences
   * @param workspaceSlug
   * @param projectId
   * @param data
   */
  updateProjectUserProperties = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<IProjectUserPropertiesResponse>
  ): Promise<IProjectUserPropertiesResponse> => {
    const previousProperties = this.projectUserPropertiesMap[projectId];
    try {
      // Optimistically update the store
      runInAction(() => {
        set(this.projectUserPropertiesMap, [projectId], data);
      });
      const response = await this.projectService.updateProjectUserProperties(workspaceSlug, projectId, data);
      return response;
    } catch (error) {
      // Revert on error
      runInAction(() => {
        if (previousProperties) {
          set(this.projectUserPropertiesMap, [projectId], previousProperties);
        } else {
          unset(this.projectUserPropertiesMap, [projectId]);
        }
      });
      throw error;
    }
  };

  /**
   * @description Mutate project members activity
   * @param workspaceSlug
   * @param projectId
   */
  private mutateProjectMembersActivity = async (workspaceSlug: string, projectId: string) => {
    const isProjectMembersActivityEnabled = this.rootStore.featureFlags.getFeatureFlag(
      workspaceSlug,
      E_FEATURE_FLAGS.PROJECT_MEMBER_ACTIVITY,
      false
    );

    if (isProjectMembersActivityEnabled) {
      await this.rootStore.projectMembersActivityStore.fetchProjectMembersActivity(workspaceSlug, projectId);
    }
  };
}
