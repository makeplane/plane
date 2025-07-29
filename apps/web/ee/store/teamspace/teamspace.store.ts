import concat from "lodash/concat";
import set from "lodash/set";
import uniq from "lodash/uniq";
import update from "lodash/update";
import xor from "lodash/xor";
import { makeObservable, action, computed, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// constants
import { ETeamspaceScope } from "@plane/constants";
// types
import { TLoader, TTeamspace, TTeamspaceMember, TTeamspaceEntities, TNameDescriptionLoader } from "@plane/types";
// utils
import { shouldFilterTeam, orderTeams } from "@plane/utils";
// plane web services
import { TeamspaceService } from "@/plane-web/services/teamspace/teamspace.service";
// plane web types
import { EWorkspaceFeatureLoader, EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
// root store
import { RootStore } from "../root.store";

export interface ITeamspaceStore {
  loader: TLoader;
  teamspaceEntitiesLoader: Record<string, TLoader>; // teamspaceId: loader
  teamspaceNameDescriptionLoader: Record<string, TNameDescriptionLoader>; // teamspaceId: name description loader
  teamspaceMap: Record<string, TTeamspace>; // teamspaceId: teamspace
  teamspaceMembersMap: Record<string, Record<string, TTeamspaceMember>>; // teamspaceId: memberId: teamspaceMember
  teamspaceEntitiesMap: Record<string, TTeamspaceEntities>; // teamspaceId: teamspaceEntities
  isTeamSidebarCollapsed: boolean;
  // computed
  currentTeamspaceProjectIds: string[] | undefined;
  currentTeamspaceMemberIds: string[] | undefined;
  allTeamSpaceIds: string[];
  joinedTeamSpaceIds: string[];
  currentScopeTeamSpaceIds: string[];
  filteredTeamSpaceIds: string[];
  isTeamspacesFeatureEnabled: boolean | undefined;
  // computed functions
  getScopeTeamSpaceIds: (scope: ETeamspaceScope) => string[];
  getTeamspaceById: (teamspaceId: string) => TTeamspace | undefined;
  getTeamspaceEntitiesLoaderById: (teamspaceId: string) => TLoader | undefined;
  getTeamspaceNameDescriptionLoaderById: (teamspaceId: string) => TNameDescriptionLoader | undefined;
  getTeamspaceEntitiesById: (teamspaceId: string) => TTeamspaceEntities | undefined;
  getTeamspaceProjectIds: (teamspaceId: string) => string[] | undefined;
  getTeamspaceMemberIds: (teamspaceId: string) => string[] | undefined;
  getTeamspaceMemberIdsFromMembersMap: (teamspaceId: string) => string[];
  getProjectTeamspaceIds: (projectId: string) => string[] | undefined;
  getAvailableTeamspaceIdsForProject: (projectId: string) => string[];
  isUserMemberOfTeamspace: (userId: string, teamspaceId: string) => boolean;
  isCurrentUserMemberOfTeamspace: (teamspaceId: string) => boolean;
  // helper actions
  updateTeamspaceNameDescriptionLoader: (teamspaceId: string, loaderType: TNameDescriptionLoader) => void;
  toggleTeamsSidebar: (collapsed?: boolean) => void;
  // fetch actions
  fetchTeamspaces: (workspaceSlug: string) => Promise<TTeamspace[]>;
  fetchTeamspaceDetails: (workspaceSlug: string, teamspaceId: string) => Promise<TTeamspace>;
  fetchTeamspaceEntities: (
    workspaceSlug: string,
    teamspaceId: string,
    loaderType?: TLoader
  ) => Promise<TTeamspaceEntities>;
  // CURD actions
  createTeamspace: (workspaceSlug: string, data: Partial<TTeamspace>) => Promise<TTeamspace>;
  updateTeamspace: (workspaceSlug: string, teamspaceId: string, data: Partial<TTeamspace>) => Promise<TTeamspace>;
  updateTeamspaceMembers: (
    workspaceSlug: string,
    teamspaceId: string,
    memberIds: string[],
    updateTeamDetails?: boolean
  ) => Promise<TTeamspaceMember[]>;
  removeTeamspaceMember: (workspaceSlug: string, teamspaceId: string, memberId: string) => Promise<void>;
  joinTeam: (workspaceSlug: string, teamspaceId: string) => Promise<void>;
  deleteTeamspace: (workspaceSlug: string, teamspaceId: string) => Promise<void>;
  addTeamspacesToProject: (workspaceSlug: string, projectId: string, teamspaceIds: string[]) => Promise<void>;
  removeTeamspaceFromProject: (workspaceSlug: string, projectId: string, teamspaceId: string) => Promise<void>;
}

export class TeamspaceStore implements ITeamspaceStore {
  // observables
  loader: TLoader = undefined;
  teamspaceEntitiesLoader: Record<string, TLoader> = {};
  teamspaceNameDescriptionLoader: Record<string, TNameDescriptionLoader> = {};
  teamspaceMap: Record<string, TTeamspace> = {};
  teamspaceMembersMap: Record<string, Record<string, TTeamspaceMember>> = {};
  teamspaceEntitiesMap: Record<string, TTeamspaceEntities> = {};
  isTeamSidebarCollapsed: boolean = false;
  // service
  teamService: TeamspaceService;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable,
      teamspaceEntitiesLoader: observable,
      teamspaceNameDescriptionLoader: observable,
      teamspaceMap: observable,
      teamspaceMembersMap: observable,
      teamspaceEntitiesMap: observable,
      isTeamSidebarCollapsed: observable,
      // computed
      currentTeamspaceProjectIds: computed,
      currentTeamspaceMemberIds: computed,
      allTeamSpaceIds: computed,
      joinedTeamSpaceIds: computed,
      currentScopeTeamSpaceIds: computed,
      filteredTeamSpaceIds: computed,
      isTeamspacesFeatureEnabled: computed,
      // helper actions
      updateTeamspaceNameDescriptionLoader: action,
      toggleTeamsSidebar: action,
      // fetch actions
      fetchTeamspaces: action,
      fetchTeamspaceDetails: action,
      fetchTeamspaceEntities: action,
      // CURD actions
      createTeamspace: action,
      updateTeamspace: action,
      updateTeamspaceMembers: action,
      removeTeamspaceMember: action,
      joinTeam: action,
      deleteTeamspace: action,
      addTeamspacesToProject: action,
      removeTeamspaceFromProject: action,
    });
    // service
    this.teamService = new TeamspaceService();
  }

  // computed
  /**
   * Returns current teamspace project IDs
   * @returns string[] | undefined
   */
  get currentTeamspaceProjectIds() {
    return this.rootStore.router.teamspaceId
      ? this.getTeamspaceProjectIds(this.rootStore.router.teamspaceId)
      : undefined;
  }

  /**
   * Returns current teamspace member IDs
   * @returns string[] | undefined
   */
  get currentTeamspaceMemberIds() {
    return this.rootStore.router.teamspaceId
      ? this.getTeamspaceMemberIds(this.rootStore.router.teamspaceId)
      : undefined;
  }

  /**
   * Returns all workspace teamspace IDs
   */
  get allTeamSpaceIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];
    // Get all teamspace IDs for current workspace
    const teamspaces = Object.values(this.teamspaceMap ?? {});
    const teamIds = teamspaces
      .filter((teamspace) => teamspace.workspace === currentWorkspace.id)
      .map((teamspace) => teamspace.id);
    return teamIds;
  }

  /**
   * Returns joined teamspace IDs
   */
  get joinedTeamSpaceIds() {
    return this.allTeamSpaceIds.filter((teamspaceId) => this.isCurrentUserMemberOfTeamspace(teamspaceId));
  }

  /**
   * Returns current scope teamspace IDs
   */
  get currentScopeTeamSpaceIds() {
    return this.getScopeTeamSpaceIds(this.rootStore.teamspaceRoot.teamspaceFilter.scope);
  }

  /**
   * Returns filtered teamspace IDs based on the teamspace filter store
   */
  get filteredTeamSpaceIds() {
    // get current workspace
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];
    // get applied teamspace filters
    const { displayFilters, filters, searchQuery } = this.rootStore.teamspaceRoot.teamspaceFilter;
    const filteredTeams = this.currentScopeTeamSpaceIds
      .map((teamspaceId) => this.getTeamspaceById(teamspaceId))
      .filter(Boolean)
      .filter(
        (teamspace) =>
          teamspace.name.toLowerCase().includes(searchQuery.toLowerCase()) && shouldFilterTeam(teamspace, filters)
      );
    const orderedTeams = orderTeams(filteredTeams, displayFilters.order_by);
    return orderedTeams.map((teamspace: TTeamspace) => teamspace.id);
  }

  /**
   * Returns whether the teamspace feature is enabled for the current workspace
   */
  get isTeamspacesFeatureEnabled() {
    const { loader, isWorkspaceFeatureEnabled } = this.rootStore.workspaceFeatures;
    const { getFeatureFlagForCurrentWorkspace } = this.rootStore.featureFlags;
    // handle workspace feature init loader
    if (loader === EWorkspaceFeatureLoader.INIT_LOADER) return undefined;
    return (
      isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMSPACES_ENABLED) &&
      getFeatureFlagForCurrentWorkspace("TEAMSPACES", false)
    );
  }

  // helper actions
  /**
   * Returns teamspace IDs by scope
   * @param scope
   * @returns string[]
   */
  getScopeTeamSpaceIds = computedFn((scope: ETeamspaceScope) => {
    if (scope === ETeamspaceScope.YOUR_TEAMS) return this.joinedTeamSpaceIds;
    if (scope === ETeamspaceScope.ALL_TEAMS) return this.allTeamSpaceIds;
    return [];
  });

  /**
   * Returns teamspace details by teamspace ID
   * @param teamspaceId
   * @returns TTeamspace | undefined
   */
  getTeamspaceById = computedFn((teamspaceId: string) => this.teamspaceMap[teamspaceId]);

  /**
   * Returns teamspace entities loader by teamspace ID
   * @param teamspaceId
   * @returns TLoader | undefined
   */
  getTeamspaceEntitiesLoaderById = computedFn((teamspaceId: string) => this.teamspaceEntitiesLoader[teamspaceId]);

  /**
   * Returns teamspace name description loader by teamspace ID
   * @param teamspaceId
   * @returns TNameDescriptionLoader | undefined
   */
  getTeamspaceNameDescriptionLoaderById = computedFn(
    (teamspaceId: string) => this.teamspaceNameDescriptionLoader[teamspaceId]
  );

  /**
   * Returns teamspace entities by teamspace ID
   * @param teamspaceId
   * @returns TTeamspaceEntities | undefined
   */
  getTeamspaceEntitiesById = computedFn((teamspaceId: string) => this.teamspaceEntitiesMap[teamspaceId]);

  /**
   * Returns teamspace project IDs by teamspace ID
   * @param teamspaceId
   * @returns string[] | undefined
   */
  getTeamspaceProjectIds = computedFn((teamspaceId: string) => this.teamspaceMap[teamspaceId]?.project_ids);

  /**
   * Returns team member IDs by teamspace ID
   * @param teamspaceId
   * @returns string[] | undefined
   */
  getTeamspaceMemberIds = computedFn((teamspaceId: string) => this.teamspaceMap[teamspaceId]?.member_ids);

  /** Returns team member IDs from members map by teamspace ID
   * @param teamspaceId
   * @returns string[]
   */
  getTeamspaceMemberIdsFromMembersMap = computedFn((teamspaceId: string) =>
    this.teamspaceMembersMap[teamspaceId] ? Object.keys(this.teamspaceMembersMap[teamspaceId]) : []
  );

  /**
   * Returns project teamspace IDs by project ID
   * @param projectId
   * @returns string[] | undefined
   */
  getProjectTeamspaceIds = computedFn((projectId: string) =>
    Object.values(this.teamspaceMap)
      .filter((teamspace) => teamspace.project_ids?.includes(projectId))
      .map((teamspace) => teamspace.id)
  );

  /**
   * Returns available teamspace IDs for a project
   * @param projectId
   * @returns string[]
   */
  getAvailableTeamspaceIdsForProject = computedFn((projectId: string) => {
    const projectTeamspaceIds = this.getProjectTeamspaceIds(projectId);
    return this.joinedTeamSpaceIds.filter((teamspaceId) => !projectTeamspaceIds.includes(teamspaceId));
  });

  /**
   * Returns whether the user is a member of the teamspace
   * @param userId
   * @param teamspaceId
   * @returns boolean
   */
  isUserMemberOfTeamspace = computedFn(
    (userId: string, teamspaceId: string) => this.getTeamspaceMemberIds(teamspaceId)?.includes(userId) ?? false
  );

  /**
   * Returns whether the current user is a member of the teamspace
   * @param teamspaceId
   * @returns boolean
   */
  isCurrentUserMemberOfTeamspace = computedFn((teamspaceId: string) => {
    const currentUserId = this.rootStore.user.data?.id;
    if (!currentUserId) return false;
    return this.isUserMemberOfTeamspace(currentUserId, teamspaceId);
  });

  // helper actions
  /**
   * Updates teamspace name description loader by teamspace ID
   * @param teamspaceId
   * @param loaderType
   */
  updateTeamspaceNameDescriptionLoader = action((teamspaceId: string, loaderType: TNameDescriptionLoader) => {
    set(this.teamspaceNameDescriptionLoader, [teamspaceId], loaderType);
  });

  /**
   * Toggles teamspace sidebar collapsed
   * @param collapsed
   */
  toggleTeamsSidebar = action((collapsed?: boolean) => {
    if (collapsed !== undefined) {
      this.isTeamSidebarCollapsed = collapsed;
    } else {
      this.isTeamSidebarCollapsed = !this.isTeamSidebarCollapsed;
    }
  });

  // fetch actions
  /**
   * Fetches teamspaces for a specific workspace and updates the store
   * @param workspaceSlug
   * @returns Promise<TTeamspace[]>
   */
  fetchTeamspaces = async (workspaceSlug: string) => {
    try {
      this.loader = "init-loader";
      // Fetch all teamspaces and team members for the workspace
      const [teamspaces, teamspaceMembers] = await Promise.all([
        this.teamService.getAllTeamspaces(workspaceSlug),
        this.teamService.getAllTeamspaceMembers(workspaceSlug),
      ]);
      runInAction(() => {
        // set team members map
        teamspaceMembers.forEach((member) => {
          set(this.teamspaceMembersMap, [member.team_space, member.member], member);
        });
        // set teamspace map along with member_ids
        teamspaces.forEach((teamspace) => {
          const teamspaceMemberIds = this.getTeamspaceMemberIdsFromMembersMap(teamspace.id);
          set(this.teamspaceMap, [teamspace.id], {
            ...teamspace,
            member_ids: teamspaceMemberIds,
          });
        });
        this.loader = "loaded";
      });
      return teamspaces;
    } catch (error) {
      console.error("Failed to fetch teamspaces", error);
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Fetches teamspace details for a teamspace ID and updates the store
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TTeamspace>
   */
  fetchTeamspaceDetails = async (workspaceSlug: string, teamspaceId: string) => {
    try {
      if (this.teamspaceMap[teamspaceId]) {
        this.loader = "mutation";
      } else {
        this.loader = "init-loader";
      }
      // Fetch teamspace details and team members
      const [teamspace, teamspaceMembers] = await Promise.all([
        this.teamService.getTeamspace(workspaceSlug, teamspaceId),
        this.teamService.getTeamspaceMembers(workspaceSlug, teamspaceId),
      ]);
      runInAction(() => {
        // set team members map
        teamspaceMembers.forEach((member) => {
          set(this.teamspaceMembersMap, [teamspaceId, member.member], member);
        });
        // set teamspace map along with member_ids
        const teamspaceMemberIds = this.getTeamspaceMemberIdsFromMembersMap(teamspace.id);
        set(this.teamspaceMap, [teamspaceId], { ...teamspace, member_ids: teamspaceMemberIds });
        this.loader = "loaded";
      });
      return teamspace;
    } catch (error) {
      console.error("Failed to fetch teamspace details", error);
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Fetches teamspace entities for a teamspace ID and updates the store
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<TTeamspaceEntities>
   */
  fetchTeamspaceEntities = async (workspaceSlug: string, teamspaceId: string, loaderType: TLoader = "init-loader") => {
    try {
      // if teamspace entities already exist, set loader type to mutation
      if (this.teamspaceEntitiesMap[teamspaceId]) {
        loaderType = "mutation";
      }
      // set loader type
      set(this.teamspaceEntitiesLoader, [teamspaceId], loaderType);
      // fetch teamspace entities
      const teamspaceEntities = await this.teamService.getTeamspaceEntities(workspaceSlug, teamspaceId);
      runInAction(() => {
        // set teamspace entities map
        set(this.teamspaceEntitiesMap, [teamspaceId], teamspaceEntities);
        // set loader type
        set(this.teamspaceEntitiesLoader, [teamspaceId], "loaded");
      });
      return teamspaceEntities;
    } catch (error) {
      console.error("Failed to fetch teamspace entities", error);
      set(this.teamspaceEntitiesLoader, [teamspaceId], "loaded");
      throw error;
    }
  };

  // CURD actions
  /**
   * Creates a teamspace and updates the store
   * @param workspaceSlug
   * @param data
   * @returns Promise<TTeamspace>
   */
  createTeamspace = async (workspaceSlug: string, data: Partial<TTeamspace>) => {
    try {
      this.loader = "mutation";
      // create teamspace
      const teamspace = await this.teamService.createTeamspace(workspaceSlug, data);
      // add current user to the list of members and update the team members
      const currentUserId = this.rootStore.user.data?.id;
      await this.updateTeamspaceMembers(
        workspaceSlug,
        teamspace.id,
        currentUserId ? uniq([...(data.member_ids ?? []), currentUserId]) : (data.member_ids ?? []),
        false
      );
      // set teamspace map along with member_ids
      runInAction(() => {
        const teamspaceMemberIds = this.getTeamspaceMemberIdsFromMembersMap(teamspace.id);
        set(this.teamspaceMap, [teamspace.id], { ...teamspace, member_ids: teamspaceMemberIds });
        this.loader = "loaded";
      });
      return teamspace;
    } catch (error) {
      console.error("Failed to create teamspace", error);
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Updates a teamspace for a teamspace ID and updates the store
   * @param workspaceSlug
   * @param teamspaceId
   * @param data
   * @returns Promise<TTeamspace>
   */
  updateTeamspace = async (workspaceSlug: string, teamspaceId: string, data: Partial<TTeamspace>) => {
    // get teamspace details before update
    const teamDetailsBeforeUpdate = this.getTeamspaceById(teamspaceId);
    // remove member_ids from data
    const { member_ids, ...payload } = data;
    // Check if teamspace projects have been updated
    const areProjectsUpdated =
      !!data.project_ids && xor(teamDetailsBeforeUpdate.project_ids, data.project_ids).length > 0;

    // Check if team members have been updated
    const areMembersUpdated = !!member_ids && xor(teamDetailsBeforeUpdate.member_ids, member_ids).length > 0;
    try {
      // update teamspace map
      runInAction(() => {
        update(this.teamspaceMap, [teamspaceId], (teamspace) => ({ ...teamspace, ...data }));
      });
      // add team members if any
      if (areMembersUpdated) {
        await this.updateTeamspaceMembers(workspaceSlug, teamspaceId, member_ids, false);
      }
      // update teamspace
      const teamspace = await this.teamService.updateTeamspace(workspaceSlug, teamspaceId, payload);
      // refetch teamspace entities if projects have been updated
      if (areProjectsUpdated) {
        Promise.all([
          this.fetchTeamspaceEntities(workspaceSlug, teamspaceId),
          this.rootStore.teamspaceRoot.teamspaceAnalytics.fetchTeamspaceAnalytics(workspaceSlug, teamspaceId),
        ]);
      } else if (areMembersUpdated) {
        // refetch teamspace analytics if members have been updated
        this.rootStore.teamspaceRoot.teamspaceAnalytics.fetchTeamspaceAnalytics(workspaceSlug, teamspaceId);
      }
      // Fetch teamspace activity
      this.rootStore.teamspaceRoot.teamspaceUpdates.fetchTeamActivities(workspaceSlug, teamspaceId);
      return teamspace;
    } catch (error) {
      console.error("Failed to update teamspace", error);
      runInAction(() => {
        set(this.teamspaceMap, [teamspaceId], teamDetailsBeforeUpdate);
      });
      throw error;
    }
  };

  /**
   * Updates project membership for all affected projects
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<void>
   */
  private updateProjectMembership = async (workspaceSlug: string, teamspaceId: string) => {
    const teamspaceProjectIds = this.getTeamspaceProjectIds(teamspaceId) ?? [];
    // refetch project membership details for all affected projects
    const projectMembershipPromises = teamspaceProjectIds.map((projectId) =>
      this.rootStore.memberRoot.project.fetchProjectMembers(workspaceSlug, projectId, true)
    );
    await Promise.allSettled(projectMembershipPromises);
  };

  /**
   * Updates team members of a teamspace and updates the store
   * @param workspaceSlug
   * @param teamspaceId
   * @param memberIds
   * @param updateTeamDetails
   * @returns Promise<TTeamspaceMember[]>
   */
  updateTeamspaceMembers = async (
    workspaceSlug: string,
    teamspaceId: string,
    memberIds: string[],
    updateTeamDetails: boolean = true
  ) => {
    try {
      // add team members
      const teamspaceMembers = await this.teamService.addTeamspaceMembers(workspaceSlug, teamspaceId, memberIds);
      runInAction(() => {
        // clear team members map
        set(this.teamspaceMembersMap, [teamspaceId], {});
        // set team members map
        teamspaceMembers.forEach((member) => {
          set(this.teamspaceMembersMap, [teamspaceId, member.member], member);
        });
        if (updateTeamDetails) {
          const teamspaceMemberIds = this.getTeamspaceMemberIdsFromMembersMap(teamspaceId);
          update(this.teamspaceMap, [teamspaceId], (teamspace) => ({
            ...teamspace,
            member_ids: teamspaceMemberIds,
          }));
        }
        // Update project membership for all affected projects
        this.updateProjectMembership(workspaceSlug, teamspaceId);
      });
      // Fetch teamspace analytics
      this.rootStore.teamspaceRoot.teamspaceAnalytics.fetchTeamspaceAnalytics(workspaceSlug, teamspaceId);
      // Fetch teamspace activity
      this.rootStore.teamspaceRoot.teamspaceUpdates.fetchTeamActivities(workspaceSlug, teamspaceId);
      return teamspaceMembers;
    } catch (error) {
      console.error("Failed to add team members", error);
      throw error;
    }
  };

  /**
   * Removes a team member from a teamspace and updates the store
   * @param workspaceSlug
   * @param teamspaceId
   * @param memberId
   * @returns Promise<void>
   */
  removeTeamspaceMember = async (workspaceSlug: string, teamspaceId: string, memberId: string) => {
    try {
      // Get teamspace space member id.
      const teamSpaceMemberId = this.teamspaceMembersMap[teamspaceId][memberId].id;
      // remove team member
      await this.teamService.removeTeamspaceMember(workspaceSlug, teamspaceId, teamSpaceMemberId);
      // delete team member from team members map
      runInAction(() => {
        delete this.teamspaceMembersMap[teamspaceId][memberId];
        update(this.teamspaceMap, [teamspaceId], (teamspace) => ({
          ...teamspace,
          member_ids: teamspace.member_ids.filter((id: string) => id !== memberId),
        }));
        // Update project membership for all affected projects
        this.updateProjectMembership(workspaceSlug, teamspaceId);
      });
      // Fetch teamspace activity
      this.rootStore.teamspaceRoot.teamspaceUpdates.fetchTeamActivities(workspaceSlug, teamspaceId);
    } catch (error) {
      console.error("Failed to remove team member", error);
      throw error;
    }
  };

  /**
   * Joins a teamspace and updates the store
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<void>
   */
  joinTeam: (workspaceSlug: string, teamspaceId: string) => Promise<void> = async (
    workspaceSlug: string,
    teamspaceId: string
  ) => {
    try {
      const currentUserId = this.rootStore.user.data?.id;
      if (!currentUserId) {
        console.error("Current user not found");
        return;
      }
      this.loader = "mutation";
      // get team member ids
      const teamspaceMemberIds = this.getTeamspaceMemberIds(teamspaceId);
      // join teamspace
      await this.updateTeamspaceMembers(
        workspaceSlug,
        teamspaceId,
        uniq([...(teamspaceMemberIds ?? []), currentUserId])
      );
      this.loader = "loaded";
    } catch (error) {
      console.error("Failed to join teamspace", error);
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Deletes a teamspace and updates the store
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<void>
   */
  deleteTeamspace = async (workspaceSlug: string, teamspaceId: string) => {
    try {
      this.loader = "mutation";
      // delete teamspace
      await this.teamService.deleteTeamspace(workspaceSlug, teamspaceId);
      // delete teamspace map and related observables
      runInAction(() => {
        delete this.teamspaceMap[teamspaceId];
        delete this.teamspaceMembersMap[teamspaceId];
        delete this.teamspaceEntitiesMap[teamspaceId];
        delete this.teamspaceEntitiesLoader[teamspaceId];
        this.loader = "loaded";
      });
    } catch (error) {
      console.error("Failed to delete teamspace", error);
      throw error;
    }
  };

  /**
   * Adds teamspaces to a project and updates the store
   * @param workspaceSlug
   * @param projectId
   * @param teamspaceIds
   * @returns Promise<void>
   */
  addTeamspacesToProject = async (workspaceSlug: string, projectId: string, teamspaceIds: string[]) => {
    try {
      this.loader = "mutation";
      await this.teamService.addTeamspacesToProject(workspaceSlug, projectId, teamspaceIds);
      // refetch project members
      this.rootStore.memberRoot.project.fetchProjectMembers(workspaceSlug, projectId, true);
      runInAction(() => {
        teamspaceIds.forEach((teamspaceId) => {
          update(this.teamspaceMap, [teamspaceId], (teamspace) => ({
            ...teamspace,
            project_ids: uniq(concat(teamspace.project_ids, projectId)),
          }));
        });
        this.loader = "loaded";
      });
    } catch (error) {
      console.error("Failed to add teamspaces to project", error);
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Removes a teamspace from a project and updates the store
   * @param workspaceSlug
   * @param projectId
   * @param teamspaceId
   * @returns Promise<void>
   */
  removeTeamspaceFromProject = async (workspaceSlug: string, projectId: string, teamspaceId: string) => {
    try {
      // get the teamspace project ids
      const currentTeamspaceProjectIds = this.getTeamspaceProjectIds(teamspaceId) ?? [];
      // Filter out the project id to remove
      const updatedProjectIds = currentTeamspaceProjectIds.filter((id) => id !== projectId);
      // update teamspace
      await this.updateTeamspace(workspaceSlug, teamspaceId, {
        project_ids: updatedProjectIds,
      });
      // refetch project members
      this.rootStore.memberRoot.project.fetchProjectMembers(workspaceSlug, projectId, true);
    } catch (error) {
      console.error("Failed to remove teamspace from project", error);
      throw error;
    }
  };
}
