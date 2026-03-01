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

import { set, sortBy } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { EUserPermissions } from "@plane/constants";
import type {
  IWorkspaceBulkInviteFormData,
  IWorkspaceMember,
  IWorkspaceMemberInvitation,
  IWorkspaceMemberMe,
  TExploredFeatures,
  TGettingStartedChecklistKeys,
  TTips,
} from "@plane/types";
// plane-web constants
// services
import { WorkspaceService } from "@/services/workspace.service";
// types
import type { IRouterStore } from "@/store/router.store";
import type { IUserStore } from "@/store/user";
// store
import type { IMemberRootStore } from "../index";
import type { IWorkspaceMemberFiltersStore } from "./filters.store";
import { WorkspaceMemberFiltersStore } from "./filters.store";
// plane web imports
import type { RootStore } from "@/plane-web/store/root.store";
export interface IWorkspaceMembership {
  id: string;
  member: string;
  role: EUserPermissions;
  is_active?: boolean;
}

export interface IWorkspaceMemberStore {
  // observables
  workspaceMemberMap: Record<string, Record<string, IWorkspaceMembership>>;
  workspaceMemberInvitations: Record<string, IWorkspaceMemberInvitation[]>;
  // filters store
  filtersStore: IWorkspaceMemberFiltersStore;
  // computed
  workspaceMemberIds: string[] | null;
  workspaceMemberInvitationIds: string[] | null;
  memberMap: Record<string, IWorkspaceMembership> | null;
  // computed actions
  getWorkspaceMemberIds: (workspaceSlug: string) => string[];
  getFilteredWorkspaceMemberIds: (workspaceSlug: string) => string[];
  getSearchedWorkspaceMemberIds: (searchQuery: string) => string[] | null;
  getSearchedWorkspaceInvitationIds: (searchQuery: string) => string[] | null;
  getWorkspaceMemberDetails: (workspaceMemberId: string) => IWorkspaceMember | null;
  getWorkspaceInvitationDetails: (invitationId: string) => IWorkspaceMemberInvitation | null;
  // fetch actions
  fetchWorkspaceMembers: (workspaceSlug: string) => Promise<IWorkspaceMember[]>;
  fetchWorkspaceMemberInvitations: (workspaceSlug: string) => Promise<IWorkspaceMemberInvitation[]>;
  // crud actions
  updateMember: (workspaceSlug: string, userId: string, data: { role: EUserPermissions }) => Promise<void>;
  removeMemberFromWorkspace: (workspaceSlug: string, userId: string) => Promise<void>;
  // invite actions
  inviteMembersToWorkspace: (workspaceSlug: string, data: IWorkspaceBulkInviteFormData) => Promise<void>;
  updateMemberInvitation: (
    workspaceSlug: string,
    invitationId: string,
    data: Partial<IWorkspaceMemberInvitation>
  ) => Promise<void>;
  deleteMemberInvitation: (workspaceSlug: string, invitationId: string) => Promise<void>;
  isUserSuspended: (userId: string, workspaceSlug: string) => boolean;
  // onboarding helpers
  getGettingStartedChecklistByWorkspaceSlug: (
    workspaceSlug: string
  ) => Partial<Record<TGettingStartedChecklistKeys, boolean>> | undefined;
  // onboarding actions
  updateExploredFeatures: (
    workspaceSlug: string,
    exploredFeatures: Partial<Record<TExploredFeatures, boolean>>
  ) => Promise<IWorkspaceMemberMe>;
  updateTips: (workspaceSlug: string, tips: Partial<Record<TTips, boolean>>) => Promise<IWorkspaceMemberMe>;
  updateChecklist: (
    workspaceSlug: string,
    checklist: Partial<Record<TGettingStartedChecklistKeys, boolean>>
  ) => Promise<IWorkspaceMemberMe>;
  updateChecklistIfNotDoneAlready: (workspaceSlug: string, key: TGettingStartedChecklistKeys) => Promise<void>;
  // mutation helpers
  mutateWorkspaceMembersActivity: (workspaceSlug: string) => Promise<void>;
}

export class WorkspaceMemberStore implements IWorkspaceMemberStore {
  // observables
  workspaceMemberMap: {
    [workspaceSlug: string]: Record<string, IWorkspaceMembership>;
  } = {}; // { workspaceSlug: { userId: userDetails } }
  workspaceMemberInvitations: Record<string, IWorkspaceMemberInvitation[]> = {}; // { workspaceSlug: [invitations] }
  // filters store
  filtersStore: IWorkspaceMemberFiltersStore;
  // stores
  rootStore: RootStore;
  routerStore: IRouterStore;
  userStore: IUserStore;
  memberRoot: IMemberRootStore;
  // services
  workspaceService;

  constructor(_memberRoot: IMemberRootStore, _rootStore: RootStore) {
    makeObservable(this, {
      // observables
      workspaceMemberMap: observable,
      workspaceMemberInvitations: observable,
      // computed
      workspaceMemberIds: computed,
      workspaceMemberInvitationIds: computed,
      memberMap: computed,
      // actions
      fetchWorkspaceMembers: action,
      updateMember: action,
      removeMemberFromWorkspace: action,
      inviteMembersToWorkspace: action,
      fetchWorkspaceMemberInvitations: action,
      updateMemberInvitation: action,
      deleteMemberInvitation: action,
      updateExploredFeatures: action,
      updateTips: action,
      updateChecklist: action,
    });
    // initialize filters store
    this.filtersStore = new WorkspaceMemberFiltersStore();
    // root store
    this.rootStore = _rootStore;
    this.routerStore = _rootStore.router;
    this.userStore = _rootStore.user;
    this.memberRoot = _memberRoot;
    // services
    this.workspaceService = new WorkspaceService();
  }

  /**
   * @description get the list of all the user ids of all the members of the current workspace
   */
  get workspaceMemberIds() {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;

    return this.getWorkspaceMemberIds(workspaceSlug);
  }

  get memberMap() {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    return this.workspaceMemberMap?.[workspaceSlug] ?? {};
  }

  get workspaceMemberInvitationIds() {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    return this.workspaceMemberInvitations?.[workspaceSlug]?.map((inv) => inv.id);
  }

  getWorkspaceMemberIds = computedFn((workspaceSlug: string) => {
    let members = Object.values(this.workspaceMemberMap?.[workspaceSlug] ?? {});
    members = sortBy(members, [
      (m) => m.member !== this.userStore?.data?.id,
      (m) => this.memberRoot?.memberMap?.[m.member]?.display_name?.toLowerCase(),
    ]);
    //filter out bots
    const memberIds = members.filter((m) => !this.memberRoot?.memberMap?.[m.member]?.is_bot).map((m) => m.member);
    return memberIds;
  });

  /**
   * @description get the filtered and sorted list of all the user ids of all the members of the workspace
   * @param workspaceSlug
   */
  getFilteredWorkspaceMemberIds = computedFn((workspaceSlug: string) => {
    let members = Object.values(this.workspaceMemberMap?.[workspaceSlug] ?? {});
    //filter out bots and inactive members
    members = members.filter((m) => !this.memberRoot?.memberMap?.[m.member]?.is_bot);

    // Use filters store to get filtered member ids
    const memberIds = this.filtersStore.getFilteredMemberIds(
      members,
      this.memberRoot?.memberMap || {},
      (member) => member.member
    );

    return memberIds;
  });

  /**
   * @description get the list of all the user ids that match the search query of all the members of the current workspace
   * @param searchQuery
   */
  getSearchedWorkspaceMemberIds = computedFn((searchQuery: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const filteredMemberIds = this.getFilteredWorkspaceMemberIds(workspaceSlug);
    if (!filteredMemberIds) return null;
    const searchedWorkspaceMemberIds = filteredMemberIds.filter((userId) => {
      const memberDetails = this.getWorkspaceMemberDetails(userId);
      if (!memberDetails) return false;
      const memberSearchQuery = `${memberDetails.member.first_name} ${memberDetails.member.last_name} ${
        memberDetails.member?.display_name
      } ${memberDetails.member.email ?? ""}`;
      return memberSearchQuery.toLowerCase()?.includes(searchQuery.toLowerCase());
    });
    return searchedWorkspaceMemberIds;
  });

  /**
   * @description get the list of all the invitation ids that match the search query of all the member invitations of the current workspace
   * @param searchQuery
   */
  getSearchedWorkspaceInvitationIds = computedFn((searchQuery: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const workspaceMemberInvitationIds = this.workspaceMemberInvitationIds;
    if (!workspaceMemberInvitationIds) return null;
    const searchedWorkspaceMemberInvitationIds = workspaceMemberInvitationIds.filter((invitationId) => {
      const invitationDetails = this.getWorkspaceInvitationDetails(invitationId);
      if (!invitationDetails) return false;
      const invitationSearchQuery = `${invitationDetails.email}`;
      return invitationSearchQuery.toLowerCase()?.includes(searchQuery.toLowerCase());
    });
    return searchedWorkspaceMemberInvitationIds;
  });

  /**
   * @description get the details of a workspace member
   * @param userId
   */
  getWorkspaceMemberDetails = computedFn((userId: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const workspaceMember = this.workspaceMemberMap?.[workspaceSlug]?.[userId];
    if (!workspaceMember) return null;

    const memberDetails: IWorkspaceMember = {
      id: workspaceMember.id,
      role: workspaceMember.role,
      member: this.memberRoot?.memberMap?.[workspaceMember.member],
      is_active: workspaceMember.is_active,
    };
    return memberDetails;
  });

  /**
   * @description get the details of a workspace member invitation
   * @param workspaceSlug
   * @param memberId
   */
  getWorkspaceInvitationDetails = computedFn((invitationId: string) => {
    const workspaceSlug = this.routerStore.workspaceSlug;
    if (!workspaceSlug) return null;
    const invitationsList = this.workspaceMemberInvitations?.[workspaceSlug];
    if (!invitationsList) return null;

    const invitation = invitationsList.find((inv) => inv.id === invitationId);
    return invitation ?? null;
  });

  /**
   * @description fetch all the members of a workspace
   * @param workspaceSlug
   */
  fetchWorkspaceMembers = async (workspaceSlug: string) =>
    await this.workspaceService.fetchWorkspaceMembers(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((member) => {
          set(this.memberRoot?.memberMap, member.member.id, { ...member.member, joining_date: member.created_at });
          set(this.workspaceMemberMap, [workspaceSlug, member.member.id], {
            id: member.id,
            member: member.member.id,
            role: member.role,
            is_active: member.is_active,
          });
        });
      });
      return response;
    });

  /**
   * @description update the role of a workspace member
   * @param workspaceSlug
   * @param userId
   * @param data
   */
  updateMember = async (workspaceSlug: string, userId: string, data: { role: EUserPermissions }) => {
    const memberDetails = this.getWorkspaceMemberDetails(userId);
    if (!memberDetails) throw new Error("Member not found");
    // original data to revert back in case of error
    const originalProjectMemberData = { ...this.workspaceMemberMap?.[workspaceSlug]?.[userId] };
    try {
      runInAction(() => {
        set(this.workspaceMemberMap, [workspaceSlug, userId, "role"], data.role);
      });
      await this.workspaceService.updateWorkspaceMember(workspaceSlug, memberDetails.id, data);
      void this.mutateWorkspaceMembersActivity(workspaceSlug);
    } catch (error) {
      // revert back to original members in case of error
      runInAction(() => {
        set(this.workspaceMemberMap, [workspaceSlug, userId], originalProjectMemberData);
      });
      throw error;
    }
  };

  /**
   * @description remove a member from workspace
   * @param workspaceSlug
   * @param userId
   */
  removeMemberFromWorkspace = async (workspaceSlug: string, userId: string) => {
    const memberDetails = this.getWorkspaceMemberDetails(userId);
    if (!memberDetails) throw new Error("Member not found");
    await this.workspaceService.deleteWorkspaceMember(workspaceSlug, memberDetails?.id);
    runInAction(() => {
      set(this.workspaceMemberMap, [workspaceSlug, userId, "is_active"], false);
    });
    void this.mutateWorkspaceMembersActivity(workspaceSlug);
  };
  /**
   * @description fetch all the member invitations of a workspace
   * @param workspaceSlug
   */
  fetchWorkspaceMemberInvitations = async (workspaceSlug: string) =>
    await this.workspaceService.workspaceInvitations(workspaceSlug).then((response) => {
      runInAction(() => {
        set(this.workspaceMemberInvitations, workspaceSlug, response);
      });
      return response;
    });

  /**
   * @description bulk invite members to a workspace
   * @param workspaceSlug
   * @param data
   */
  inviteMembersToWorkspace = async (workspaceSlug: string, data: IWorkspaceBulkInviteFormData) => {
    await this.workspaceService.inviteWorkspace(workspaceSlug, data);
    await this.fetchWorkspaceMemberInvitations(workspaceSlug);
    // Auto-complete getting started checklist
    void this.updateChecklistIfNotDoneAlready(workspaceSlug, "team_members_invited");
    void this.mutateWorkspaceMembersActivity(workspaceSlug);
  };

  /**
   * @description update the role of a member invitation
   * @param workspaceSlug
   * @param invitationId
   * @param data
   */
  updateMemberInvitation = async (
    workspaceSlug: string,
    invitationId: string,
    data: Partial<IWorkspaceMemberInvitation>
  ) => {
    const originalMemberInvitations = [...(this.workspaceMemberInvitations?.[workspaceSlug] || [])]; // in case of error, we will revert back to original members
    try {
      const memberInvitations = originalMemberInvitations?.map((invitation) => ({
        ...invitation,
        ...(invitation.id === invitationId && data),
      }));
      // optimistic update
      runInAction(() => {
        set(this.workspaceMemberInvitations, workspaceSlug, memberInvitations);
      });
      await this.workspaceService.updateWorkspaceInvitation(workspaceSlug, invitationId, data);
    } catch (error) {
      // revert back to original members in case of error
      runInAction(() => {
        set(this.workspaceMemberInvitations, workspaceSlug, originalMemberInvitations);
      });
      throw error;
    }
  };

  /**
   * @description delete a member invitation
   * @param workspaceSlug
   * @param memberId
   */
  deleteMemberInvitation = async (workspaceSlug: string, invitationId: string) => {
    await this.workspaceService.deleteWorkspaceInvitations(workspaceSlug.toString(), invitationId);
    runInAction(() => {
      this.workspaceMemberInvitations[workspaceSlug] = this.workspaceMemberInvitations[workspaceSlug].filter(
        (inv) => inv.id !== invitationId
      );
    });
    void this.mutateWorkspaceMembersActivity(workspaceSlug);
  };

  isUserSuspended = computedFn((userId: string, workspaceSlug: string) => {
    if (!workspaceSlug) return false;
    const workspaceMember = this.workspaceMemberMap?.[workspaceSlug]?.[userId];
    return workspaceMember?.is_active === false;
  });

  /**
   * @description Returns the getting started checklist for a workspace
   * @param { string } workspaceSlug
   * @returns { Partial<Record<TGettingStartedChecklistKeys, boolean>> | undefined }
   */
  getGettingStartedChecklistByWorkspaceSlug = computedFn(
    (workspaceSlug: string): Partial<Record<TGettingStartedChecklistKeys, boolean>> | undefined => {
      const checklist = this.rootStore.user.permission.workspaceUserInfo[workspaceSlug]?.getting_started_checklist;
      if (!checklist) return undefined;

      // Filter out null values to match return type
      const filtered: Partial<Record<TGettingStartedChecklistKeys, boolean>> = {};

      (Object.keys(checklist) as TGettingStartedChecklistKeys[]).forEach((key) => {
        const value = checklist[key];
        if (value !== null) {
          filtered[key] = value;
        }
      });
      return filtered;
    }
  );

  /**
   * @description Generic helper to update member onboarding fields
   * @private
   * @param { string } workspaceSlug
   * @param { "explored_features" | "tips" | "getting_started_checklist" } fieldKey - The key of the field in IWorkspaceMemberMe
   * @param { Partial<Record<string, boolean>> } updates - The updates to apply
   * @param { string } errorMessage - Custom error message for this field
   * @returns { Promise<IWorkspaceMemberMe> }
   */
  private updateMemberOnboardingField = async (
    workspaceSlug: string,
    fieldKey: "explored_features" | "tips" | "getting_started_checklist",
    updates: Partial<Record<string, boolean>>,
    errorMessage: string
  ): Promise<IWorkspaceMemberMe> => {
    try {
      const existingData = this.rootStore.user.permission.workspaceUserInfo[workspaceSlug]?.[fieldKey];
      const filteredExisting: Record<string, boolean> = {};

      if (existingData && typeof existingData === "object") {
        Object.entries(existingData).forEach(([key, value]) => {
          if (value !== null && typeof value === "boolean") {
            filteredExisting[key] = value;
          }
        });
      }

      const response = await this.workspaceService.updateMemberOnboarding(workspaceSlug, {
        [fieldKey]: {
          ...filteredExisting,
          ...updates,
        },
      });

      if (response) {
        runInAction(() => {
          const currentFieldData = this.rootStore.user.permission.workspaceUserInfo[workspaceSlug]?.[fieldKey];
          const mergedData: Record<string, boolean> = {};

          if (currentFieldData && typeof currentFieldData === "object") {
            Object.entries(currentFieldData).forEach(([key, value]) => {
              if (value !== null && typeof value === "boolean") {
                mergedData[key] = value;
              }
            });
          }

          set(this.rootStore.user.permission.workspaceUserInfo, [workspaceSlug], {
            ...this.rootStore.user.permission.workspaceUserInfo[workspaceSlug],
            [fieldKey]: {
              ...mergedData,
              ...updates,
            },
          });
        });
      }

      return response;
    } catch (error) {
      console.error(errorMessage, error);
      throw error;
    }
  };

  /**
   * @description Updates the explored features for the current user in a workspace
   * @param { string } workspaceSlug
   * @param { Partial<Record<TExploredFeatures, boolean>> } exploredFeatures
   * @returns { Promise<IWorkspaceMemberMe> }
   */
  updateExploredFeatures = async (
    workspaceSlug: string,
    exploredFeatures: Partial<Record<TExploredFeatures, boolean>>
  ): Promise<IWorkspaceMemberMe> =>
    this.updateMemberOnboardingField(
      workspaceSlug,
      "explored_features",
      exploredFeatures,
      "Error updating explored features"
    );

  /**
   * @description Updates the tips for the current user in a workspace
   * @param { string } workspaceSlug
   * @param { Partial<Record<TTips, boolean>> } tips
   * @returns { Promise<IWorkspaceMemberMe> }
   */
  updateTips = async (workspaceSlug: string, tips: Partial<Record<TTips, boolean>>): Promise<IWorkspaceMemberMe> =>
    this.updateMemberOnboardingField(workspaceSlug, "tips", tips, "Error updating tips");

  /**
   * @description Updates the getting started checklist for the current user in a workspace
   * @param { string } workspaceSlug
   * @param { Partial<Record<TGettingStartedChecklistKeys, boolean>> } checklist
   * @returns { Promise<IWorkspaceMemberMe> }
   */
  updateChecklist = async (
    workspaceSlug: string,
    checklist: Partial<Record<TGettingStartedChecklistKeys, boolean>>
  ): Promise<IWorkspaceMemberMe> =>
    this.updateMemberOnboardingField(workspaceSlug, "getting_started_checklist", checklist, "Error updating checklist");

  /**
   * @description Updates a checklist item only if it hasn't been completed already
   * @param { string } workspaceSlug
   * @param { TGettingStartedChecklistKeys } key
   * @returns { Promise<void> }
   */
  updateChecklistIfNotDoneAlready = async (workspaceSlug: string, key: TGettingStartedChecklistKeys): Promise<void> => {
    const checklistData = this.getGettingStartedChecklistByWorkspaceSlug(workspaceSlug);
    if (!checklistData?.[key]) {
      await this.updateChecklist(workspaceSlug, { [key]: true });
    }
  };

  /**
   * Mutate workspace members activity
   * @param workspaceSlug
   */
  mutateWorkspaceMembersActivity = async (workspaceSlug: string) => {
    const isMembersActivityEnabled = this.rootStore.featureFlags.getFeatureFlag(
      workspaceSlug,
      E_FEATURE_FLAGS.WORKSPACE_MEMBER_ACTIVITY,
      false
    );

    if (isMembersActivityEnabled) {
      await this.rootStore.workspaceMembersActivityStore.fetchWorkspaceMembersActivity(workspaceSlug);
    }
  };
}
