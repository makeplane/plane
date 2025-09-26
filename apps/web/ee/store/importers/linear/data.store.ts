import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { LinearOrganization, LinearTeam, LinearState } from "@plane/etl/linear";
import { IAdditionalUsersResponse } from "@plane/types";
// plane web services
import { LinearService } from "@/plane-web/services/importers/linear/data.service";
// plane web store types
import { RootStore } from "@/plane-web/store/root.store";

export interface ILinearDataStore {
  // observables
  isLoading: boolean;
  error: object;
  linearOrganizations: Record<string, LinearOrganization>; // organizationId -> resource
  linearTeams: Record<string, LinearTeam>; // teamId -> team
  linearStates: Record<string, Record<string, LinearState>>; // teamId -> stateId -> state
  linearIssueCount: Record<string, number>; // teamId -> issueCount
  linearDataSummary: Record<string, Record<string, number>>; // teamId -> entity -> count
  additionalUsersData: IAdditionalUsersResponse;
  // computed
  linearOrganizationId: string;
  linearTeamIds: string[];
  // computed functions
  linearStateIdsByTeamId: (teamId: string) => string[];
  getLinearOrganizationById: (organizationId: string) => LinearOrganization | undefined;
  getLinearTeamById: (teamId: string) => LinearTeam | undefined;
  getLinearStateById: (teamId: string, stateId: string) => LinearState | undefined;
  getLinearIssueCountByTeamId: (teamId: string) => number;
  // actions
  fetchLinearOrganizations: (workspaceId: string, userId: string) => Promise<LinearOrganization | undefined>;
  fetchLinearTeams: (workspaceId: string, userId: string) => Promise<LinearTeam[] | undefined>;
  fetchLinearTeamStates: (workspaceId: string, userId: string, teamId: string) => Promise<LinearState[] | undefined>;
  fetchLinearTeamIssueCount: (workspaceId: string, userId: string, teamId: string) => Promise<number | undefined>;
  fetchLinearTeamDataSummary: (
    workspaceId: string,
    userId: string,
    teamId: string
  ) => Promise<Record<string, number> | undefined>;
  fetchAdditionalUsers: (
    workspaceId: string,
    userId: string,
    workspaceSlug: string,
    teamId: string
  ) => Promise<IAdditionalUsersResponse | undefined>;
}

export class LinearDataStore implements ILinearDataStore {
  // observables
  isLoading: boolean = false;
  error: object = {};
  linearOrganizations: Record<string, LinearOrganization> = {}; // organizationId -> resource
  linearTeams: Record<string, LinearTeam> = {}; // teamId -> team
  linearStates: Record<string, Record<string, LinearState>> = {}; // teamId -> stateId -> state
  linearIssueCount: Record<string, number> = {}; // teamId -> issueCount
  linearDataSummary: Record<string, Record<string, number>> = {}; // teamId -> entity -> count
  additionalUsersData: IAdditionalUsersResponse = {
    additionalUserCount: 0,
    occupiedUserCount: 0,
  };
  // service
  service: LinearService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      linearOrganizations: observable,
      linearTeams: observable,
      linearStates: observable,
      linearIssueCount: observable,
      additionalUsersData: observable,
      // computed
      linearOrganizationId: computed,
      linearTeamIds: computed,
      // actions
      fetchLinearOrganizations: action,
      fetchLinearTeams: action,
      fetchLinearTeamStates: action,
      fetchLinearTeamIssueCount: action,
      fetchAdditionalUsers: action,
    });

    this.service = new LinearService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  // computed
  /**
   * @description Returns the list of resource ids
   * @returns { string[] }
   */
  get linearOrganizationId(): string {
    return Object.keys(this.linearOrganizations)[0];
  }

  // computed functions
  /**
   * @description Returns the list of project ids by organization id
   * @param { string } organizationId
   * @returns { string[] | undefined }
   */
  get linearTeamIds(): string[] {
    const teams = this.linearTeams;
    if (!teams) return [];
    return Object.keys(teams);
  }

  /**
   * @description Returns the list of state ids by team id
   * @param { string } teamId
   * @returns { string[] | undefined }
   */
  linearStateIdsByTeamId = computedFn((teamId: string): string[] => {
    const projectStates = this.linearStates[teamId];
    if (!projectStates) return [];
    return Object.keys(projectStates);
  });

  /**
   * @description Returns the resource by organization id
   * @param { string } organizationId
   * @returns { LinearOrganization | undefined }
   */
  getLinearOrganizationById = computedFn(
    (organizationId: string): LinearOrganization | undefined => this.linearOrganizations[organizationId]
  );

  /**
   * @description Returns the project by organization id and team id
   * @param { string } teamId
   * @returns { LinearTeam | undefined }
   */
  getLinearTeamById = computedFn((teamId: string): LinearTeam | undefined => this.linearTeams?.[teamId]);

  /**
   * @description Returns the state by team id and state id
   * @param { string } teamId
   * @param { string } stateId
   * @returns { LinearState | undefined }
   */
  getLinearStateById = computedFn(
    (teamId: string, stateId: string): LinearState | undefined => this.linearStates[teamId]?.[stateId]
  );

  /**
   * @description Returns the issue count by team id
   * @param { string } teamId
   * @returns { number }
   */
  getLinearIssueCountByTeamId = computedFn((teamId: string): number => this.linearIssueCount[teamId] || 0);

  /**
   * @description Returns the data summary by team id
   * @param { string } teamId
   * @returns { Record<string, number> }
   */
  getLinearDataSummaryByTeamId = computedFn(
    (teamId: string): Record<string, number> => this.linearDataSummary[teamId] || {}
  );

  // actions
  /**
   * @description Fetches the list of Linear organizations
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<LinearOrganization | undefined> }
   */
  fetchLinearOrganizations = async (workspaceId: string, userId: string): Promise<LinearOrganization | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const organization = await this.service.getOrganizations(workspaceId, userId);

      runInAction(() => {
        if (organization?.id) set(this.linearOrganizations, organization?.id, organization);
      });

      this.isLoading = false;
      return organization;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of Linear teams
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<LinearTeam[] | undefined> }
   */
  fetchLinearTeams = async (workspaceId: string, userId: string): Promise<LinearTeam[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const teams = await this.service.getTeams(workspaceId, userId);
      if (teams) {
        runInAction(() => {
          teams.forEach((team) => {
            set(this.linearTeams, [team.id], team);
          });
        });
      }
      this.isLoading = false;
      return teams;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of Linear team states
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } teamId
   * @returns { Promise<LinearState[] | undefined> }
   */
  fetchLinearTeamStates = async (
    workspaceId: string,
    userId: string,
    teamId: string
  ): Promise<LinearState[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const states = await this.service.getTeamStates(workspaceId, userId, teamId);
      if (states) {
        runInAction(() => {
          states.forEach((state) => {
            set(this.linearStates, [teamId, state.id], state);
          });
        });
      }
      this.isLoading = false;
      return states;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the issue count by team id
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } teamId
   * @returns { Promise<number | undefined> }
   */
  fetchLinearTeamIssueCount = async (
    workspaceId: string,
    userId: string,
    teamId: string
  ): Promise<number | undefined> => {
    try {
      const issueCount = await this.service.getTeamIssueCount(workspaceId, userId, teamId);
      if (issueCount) {
        runInAction(() => {
          if (!this.linearIssueCount[teamId]) this.linearIssueCount[teamId] = 0;
          this.linearIssueCount[teamId] = issueCount;
        });
      }
      this.isLoading = false;
      return issueCount;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the data summary by team id
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } teamId
   * @returns { Promise<number | undefined> }
   */
  fetchLinearTeamDataSummary = async (
    workspaceId: string,
    userId: string,
    teamId: string
  ): Promise<Record<string, number> | undefined> => {
    try {
      const dataSummary = await this.service.getDataSummary(workspaceId, userId, teamId);
      if (dataSummary) {
        runInAction(() => {
          if (!this.linearDataSummary[teamId]) this.linearDataSummary[teamId] = {};
          this.linearDataSummary[teamId] = dataSummary;
        });
      }
      this.isLoading = false;
      return dataSummary;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches additional users on import
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } workspaceSlug
   * @param { string } teamId
   * @returns { Promise<IAdditionalUsersResponse | undefined> }
   */
  fetchAdditionalUsers = async (
    workspaceId: string,
    userId: string,
    workspaceSlug: string,
    teamId: string
  ): Promise<IAdditionalUsersResponse | undefined> => {
    try {
      const additionalUserResponse = (await this.service.getAdditionalUsers(
        workspaceId,
        userId,
        workspaceSlug,
        teamId
      )) as IAdditionalUsersResponse;
      if (additionalUserResponse?.additionalUserCount) {
        runInAction(() => {
          this.additionalUsersData = additionalUserResponse;
        });
      }
      return additionalUserResponse;
    } catch (error) {
      this.error = error as unknown as object;
    }
  };
}
