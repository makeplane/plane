import set from "lodash/set";
import update from "lodash/update";
import xor from "lodash/xor";
import { makeObservable, action, computed, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TLoader, TTeam, TTeamMember, TTeamEntities, TNameDescriptionLoader } from "@plane/types";
// utils
import { shouldFilterTeam, orderTeams } from "@plane/utils";
// plane web services
import { TeamService } from "@/plane-web/services/teams/team.service";
// plane web types
import { EWorkspaceFeatureLoader, EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
// root store
import { RootStore } from "../root.store";

export interface ITeamStore {
  loader: TLoader;
  teamEntitiesLoader: Record<string, TLoader>; // teamId: loader
  teamNameDescriptionLoader: Record<string, TNameDescriptionLoader>; // teamId: name description loader
  teamMap: Record<string, TTeam>; // teamId: team
  teamMembersMap: Record<string, Record<string, TTeamMember>>; // teamId: memberId: teamMember
  teamEntitiesMap: Record<string, TTeamEntities>; // teamId: teamEntities
  isTeamSidebarCollapsed: boolean;
  // computed
  currentTeamProjectIds: string[] | undefined;
  allTeamIds: string[];
  joinedTeamIds: string[];
  filteredTeamIds: string[];
  isTeamsFeatureEnabled: boolean | undefined;
  // computed functions
  getTeamById: (teamId: string) => TTeam | undefined;
  getTeamEntitiesLoaderById: (teamId: string) => TLoader | undefined;
  getTeamNameDescriptionLoaderById: (teamId: string) => TNameDescriptionLoader | undefined;
  getTeamEntitiesById: (teamId: string) => TTeamEntities | undefined;
  getTeamProjectIds: (teamId: string) => string[] | undefined;
  getTeamMemberIds: (teamId: string) => string[] | undefined;
  isUserMemberOfTeam: (teamId: string) => boolean;
  // helper actions
  updateTeamNameDescriptionLoader: (teamId: string, loaderType: TNameDescriptionLoader) => void;
  toggleTeamsSidebar: (collapsed?: boolean) => void;
  // fetch actions
  fetchTeams: (workspaceSlug: string) => Promise<TTeam[]>;
  fetchTeamDetails: (workspaceSlug: string, teamId: string) => Promise<TTeam>;
  fetchTeamEntities: (workspaceSlug: string, teamId: string, loaderType?: TLoader) => Promise<TTeamEntities>;
  // CURD actions
  createTeam: (workspaceSlug: string, data: Partial<TTeam>) => Promise<TTeam>;
  updateTeam: (workspaceSlug: string, teamId: string, data: Partial<TTeam>) => Promise<TTeam>;
  addTeamMembers: (
    workspaceSlug: string,
    teamId: string,
    memberIds: string[],
    updateTeamDetails?: boolean
  ) => Promise<TTeamMember[]>;
  removeTeamMember: (workspaceSlug: string, teamId: string, memberId: string) => Promise<void>;
  joinTeam: (workspaceSlug: string, teamId: string) => Promise<void>;
  deleteTeam: (workspaceSlug: string, teamId: string) => Promise<void>;
}

export class TeamStore implements ITeamStore {
  // observables
  loader: TLoader = undefined;
  teamEntitiesLoader: Record<string, TLoader> = {};
  teamNameDescriptionLoader: Record<string, TNameDescriptionLoader> = {};
  teamMap: Record<string, TTeam> = {};
  teamMembersMap: Record<string, Record<string, TTeamMember>> = {};
  teamEntitiesMap: Record<string, TTeamEntities> = {};
  isTeamSidebarCollapsed: boolean = false;
  // service
  teamService: TeamService;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable,
      teamEntitiesLoader: observable,
      teamNameDescriptionLoader: observable,
      teamMap: observable,
      teamMembersMap: observable,
      teamEntitiesMap: observable,
      isTeamSidebarCollapsed: observable,
      // computed
      currentTeamProjectIds: computed,
      allTeamIds: computed,
      joinedTeamIds: computed,
      filteredTeamIds: computed,
      isTeamsFeatureEnabled: computed,
      // helper actions
      updateTeamNameDescriptionLoader: action,
      // fetch actions
      fetchTeams: action,
      fetchTeamDetails: action,
      fetchTeamEntities: action,
      // CURD actions
      createTeam: action,
      updateTeam: action,
      addTeamMembers: action,
      removeTeamMember: action,
      joinTeam: action,
      deleteTeam: action,
    });
    // service
    this.teamService = new TeamService();
  }

  // computed
  /**
   * Returns current team project IDs
   * @returns string[] | undefined
   */
  get currentTeamProjectIds() {
    return this.rootStore.router.teamId ? this.getTeamProjectIds(this.rootStore.router.teamId) : undefined;
  }

  /**
   * Returns all workspace team IDs
   */
  get allTeamIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];
    // Get all team IDs for current workspace
    const teams = Object.values(this.teamMap ?? {});
    const teamIds = teams.filter((team) => team.workspace === currentWorkspace.id).map((team) => team.id);
    return teamIds;
  }

  /**
   * Returns joined team IDs
   */
  get joinedTeamIds() {
    return this.allTeamIds.filter((teamId) => this.isUserMemberOfTeam(teamId));
  }

  /**
   * Returns filtered team IDs based on the team filter store
   */
  get filteredTeamIds() {
    // get current workspace
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];
    // get applied team filters
    const { displayFilters, filters, searchQuery } = this.rootStore.teamRoot.teamFilter;
    const filteredTeams = Object.values(this.teamMap).filter(
      (team) =>
        team.workspace === currentWorkspace.id &&
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        shouldFilterTeam(team, filters)
    );
    const orderedTeams = orderTeams(filteredTeams, displayFilters.order_by);
    return orderedTeams.map((team: TTeam) => team.id);
  }

  /**
   * Returns whether the teams feature is enabled for the current workspace
   */
  get isTeamsFeatureEnabled() {
    const { loader, isWorkspaceFeatureEnabled } = this.rootStore.workspaceFeatures;
    const { getFeatureFlagForCurrentWorkspace } = this.rootStore.featureFlags;
    // handle workspace feature init loader
    if (loader === EWorkspaceFeatureLoader.INIT_LOADER) return undefined;
    return (
      isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMS_ENABLED) &&
      getFeatureFlagForCurrentWorkspace("TEAMS", false)
    );
  }

  // helper actions
  /**
   * Returns team details by team ID
   * @param teamId
   * @returns TTeam | undefined
   */
  getTeamById = computedFn((teamId: string) => this.teamMap[teamId]);

  /**
   * Returns team entities loader by team ID
   * @param teamId
   * @returns TLoader | undefined
   */
  getTeamEntitiesLoaderById = computedFn((teamId: string) => this.teamEntitiesLoader[teamId]);

  /**
   * Returns team name description loader by team ID
   * @param teamId
   * @returns TNameDescriptionLoader | undefined
   */
  getTeamNameDescriptionLoaderById = computedFn((teamId: string) => this.teamNameDescriptionLoader[teamId]);

  /**
   * Returns team entities by team ID
   * @param teamId
   * @returns TTeamEntities | undefined
   */
  getTeamEntitiesById = computedFn((teamId: string) => this.teamEntitiesMap[teamId]);

  /**
   * Returns team project IDs by team ID
   * @param teamId
   * @returns string[] | undefined
   */
  getTeamProjectIds = computedFn((teamId: string) => this.teamMap[teamId]?.project_ids);

  /**
   * Returns team member IDs by team ID
   * @param teamId
   * @returns string[] | undefined
   */
  getTeamMemberIds = computedFn((teamId: string) => this.teamMap[teamId]?.member_ids);

  /**
   * Returns whether the user is a member of the team
   * @param teamId
   * @returns boolean
   */
  isUserMemberOfTeam = computedFn((teamId: string) => {
    const currentUserId = this.rootStore.user.data?.id;
    if (!currentUserId) return false;
    return this.getTeamMemberIds(teamId)?.includes(currentUserId) ?? false;
  });

  // helper actions
  /**
   * Updates team name description loader by team ID
   * @param teamId
   * @param loaderType
   */
  updateTeamNameDescriptionLoader = action((teamId: string, loaderType: TNameDescriptionLoader) => {
    set(this.teamNameDescriptionLoader, [teamId], loaderType);
  });

  /**
   * Toggles team sidebar collapsed
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
   * Fetches teams for a specific workspace and updates the store
   * @param workspaceSlug
   * @returns Promise<TTeam[]>
   */
  fetchTeams = async (workspaceSlug: string) => {
    try {
      this.loader = "init-loader";
      // Fetch all teams and team members for the workspace
      const [teams, teamMembers] = await Promise.all([
        this.teamService.getAllTeams(workspaceSlug),
        this.teamService.getAllTeamMembers(workspaceSlug),
      ]);
      runInAction(() => {
        // set team members map
        teamMembers.forEach((member) => {
          set(this.teamMembersMap, [member.team_space, member.member], member);
        });
        // set team map along with member_ids
        teams.forEach((team) => {
          const teamMemberIds = Object.keys(this.teamMembersMap[team.id]);
          set(this.teamMap, [team.id], {
            ...team,
            member_ids: teamMemberIds,
          });
        });
        this.loader = "loaded";
      });
      return teams;
    } catch (error) {
      console.error("Failed to fetch teams", error);
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Fetches team details for a team ID and updates the store
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<TTeam>
   */
  fetchTeamDetails = async (workspaceSlug: string, teamId: string) => {
    try {
      if (this.teamMap[teamId]) {
        this.loader = "mutation";
      } else {
        this.loader = "init-loader";
      }
      // Fetch team details and team members
      const [team, teamMembers] = await Promise.all([
        this.teamService.getTeam(workspaceSlug, teamId),
        this.teamService.getTeamMembers(workspaceSlug, teamId),
      ]);
      runInAction(() => {
        // set team members map
        teamMembers.forEach((member) => {
          set(this.teamMembersMap, [teamId, member.member], member);
        });
        // set team map along with member_ids
        const teamMemberIds = Object.keys(this.teamMembersMap[teamId]);
        set(this.teamMap, [teamId], { ...team, member_ids: teamMemberIds });
        this.loader = "loaded";
      });
      return team;
    } catch (error) {
      console.error("Failed to fetch team details", error);
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Fetches team entities for a team ID and updates the store
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<TTeamEntities>
   */
  fetchTeamEntities = async (workspaceSlug: string, teamId: string, loaderType: TLoader = "init-loader") => {
    try {
      // if team entities already exist, set loader type to mutation
      if (this.teamEntitiesMap[teamId]) {
        loaderType = "mutation";
      }
      // set loader type
      set(this.teamEntitiesLoader, [teamId], loaderType);
      // fetch team entities
      const teamEntities = await this.teamService.getTeamEntities(workspaceSlug, teamId);
      runInAction(() => {
        // set team entities map
        set(this.teamEntitiesMap, [teamId], teamEntities);
        // set loader type
        set(this.teamEntitiesLoader, [teamId], "loaded");
      });
      return teamEntities;
    } catch (error) {
      console.error("Failed to fetch team entities", error);
      set(this.teamEntitiesLoader, [teamId], "loaded");
      throw error;
    }
  };

  // CURD actions
  /**
   * Creates a team and updates the store
   * @param workspaceSlug
   * @param data
   * @returns Promise<TTeam>
   */
  createTeam = async (workspaceSlug: string, data: Partial<TTeam>) => {
    try {
      this.loader = "mutation";
      // create team
      const team = await this.teamService.createTeam(workspaceSlug, data);
      // add team members
      if (data.member_ids) {
        await this.addTeamMembers(workspaceSlug, team.id, data.member_ids, false);
      }
      // set team map along with member_ids
      runInAction(() => {
        const teamMemberIds = Object.keys(this.teamMembersMap[team.id]);
        set(this.teamMap, [team.id], { ...team, member_ids: teamMemberIds });
        this.loader = "loaded";
      });
      return team;
    } catch (error) {
      console.error("Failed to create team", error);
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Updates a team for a team ID and updates the store
   * @param workspaceSlug
   * @param teamId
   * @param data
   * @returns Promise<TTeam>
   */
  updateTeam = async (workspaceSlug: string, teamId: string, data: Partial<TTeam>) => {
    // get team details before update
    const teamDetailsBeforeUpdate = this.getTeamById(teamId);
    // remove member_ids from data
    const { member_ids, ...payload } = data;
    // get member ids to be added
    const memberIdsToBeAdded = member_ids
      ? member_ids.filter((memberId) => !teamDetailsBeforeUpdate.member_ids?.includes(memberId))
      : [];
    // Check if team projects have been updated
    const areProjectsUpdated = xor(teamDetailsBeforeUpdate.project_ids, data.project_ids).length > 0;
    try {
      // update team map
      runInAction(() => {
        update(this.teamMap, [teamId], (team) => ({ ...team, ...data }));
      });
      // add team members if any
      if (memberIdsToBeAdded.length > 0) {
        await this.addTeamMembers(workspaceSlug, teamId, memberIdsToBeAdded, false);
      }
      // update team
      const team = await this.teamService.updateTeam(workspaceSlug, teamId, payload);
      // refetch team entities if projects have been updated
      if (areProjectsUpdated) {
        await this.fetchTeamEntities(workspaceSlug, teamId);
      }
      return team;
    } catch (error) {
      console.error("Failed to update team", error);
      runInAction(() => {
        set(this.teamMap, [teamId], teamDetailsBeforeUpdate);
      });
      throw error;
    }
  };

  /**
   * Adds team members to a team and updates the store
   * @param workspaceSlug
   * @param teamId
   * @param memberIds
   * @param updateTeamDetails
   * @returns Promise<TTeamMember[]>
   */
  addTeamMembers = async (
    workspaceSlug: string,
    teamId: string,
    memberIds: string[],
    updateTeamDetails: boolean = true
  ) => {
    try {
      // add team members
      const teamMembers = await this.teamService.addTeamMembers(workspaceSlug, teamId, memberIds);
      // set team members map
      runInAction(() => {
        teamMembers.forEach((member) => {
          set(this.teamMembersMap, [teamId, member.member], member);
        });
        if (updateTeamDetails) {
          const teamMemberIds = Object.keys(this.teamMembersMap[teamId]);
          update(this.teamMap, [teamId], (team) => ({
            ...team,
            member_ids: teamMemberIds,
          }));
        }
      });
      return teamMembers;
    } catch (error) {
      console.error("Failed to add team members", error);
      throw error;
    }
  };

  /**
   * Removes a team member from a team and updates the store
   * @param workspaceSlug
   * @param teamId
   * @param memberId
   * @returns Promise<void>
   */
  removeTeamMember = async (workspaceSlug: string, teamId: string, memberId: string) => {
    try {
      // Get team space member id.
      const teamSpaceMemberId = this.teamMembersMap[teamId][memberId].id;
      // remove team member
      await this.teamService.removeTeamMember(workspaceSlug, teamId, teamSpaceMemberId);
      // delete team member from team members map
      runInAction(() => {
        delete this.teamMembersMap[teamId][memberId];
        update(this.teamMap, [teamId], (team) => ({
          ...team,
          member_ids: team.member_ids.filter((id: string) => id !== memberId),
        }));
      });
    } catch (error) {
      console.error("Failed to remove team member", error);
      throw error;
    }
  };

  /**
   * Joins a team and updates the store
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<void>
   */
  joinTeam: (workspaceSlug: string, teamId: string) => Promise<void> = async (
    workspaceSlug: string,
    teamId: string
  ) => {
    try {
      const currentUserId = this.rootStore.user.data?.id;
      if (!currentUserId) {
        console.error("Current user not found");
        return;
      }
      this.loader = "mutation";
      // join team
      await this.addTeamMembers(workspaceSlug, teamId, [currentUserId]);
      this.loader = "loaded";
    } catch (error) {
      console.error("Failed to join team", error);
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Deletes a team and updates the store
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<void>
   */
  deleteTeam = async (workspaceSlug: string, teamId: string) => {
    try {
      this.loader = "mutation";
      // delete team
      await this.teamService.deleteTeam(workspaceSlug, teamId);
      // delete team map and related observables
      runInAction(() => {
        delete this.teamMap[teamId];
        delete this.teamMembersMap[teamId];
        delete this.teamEntitiesMap[teamId];
        delete this.teamEntitiesLoader[teamId];
        this.loader = "loaded";
      });
    } catch (error) {
      console.error("Failed to delete team", error);
      throw error;
    }
  };
}
