import axios, { AxiosInstance } from "axios";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { LinearTeam, LinearState, LinearOrganization } from "@plane/etl/linear";
import { IAdditionalUsersResponse } from "@plane/types";

export class LinearService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  async getOrganizations(workspaceId: string, userId: string): Promise<LinearOrganization | undefined> {
    return this.axiosInstance
      .get(`/api/linear/org?workspaceId=${workspaceId}&userId=${userId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get teams
   * @property workspaceId: string
   * @property userId: string
   * @returns teams | undefined
   */
  async getTeams(workspaceId: string, userId: string): Promise<LinearTeam[] | undefined> {
    return this.axiosInstance
      .post(`/api/linear/teams`, { workspaceId, userId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project states
   * @property workspaceId: string
   * @property userId: string
   * @property teamId: string
   * @returns states | undefined
   */
  async getTeamStates(workspaceId: string, userId: string, teamId: string): Promise<LinearState[] | undefined> {
    return this.axiosInstance
      .post(`/api/linear/team-states`, { workspaceId, userId, teamId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project issues count
   * @property workspaceId: string
   * @property userId: string
   * @property teamId: string
   * @returns number | undefined
   */
  async getTeamIssueCount(workspaceId: string, userId: string, teamId: string): Promise<number | undefined> {
    return this.axiosInstance
      .post(`/api/linear/team-issue-count`, { workspaceId, userId, teamId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project issues count
   * @property workspaceId: string
   * @property userId: string
   * @property teamId: string
   * @returns { Promise<{ issueCount: number; documentCount: number } | undefined> }
   */
  async getDataSummary(workspaceId: string, userId: string, teamId: string): Promise<{ issueCount: number; documentCount: number } | undefined> {
    return this.axiosInstance
      .post(`/api/linear/data-summary`, { workspaceId, userId, teamId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get additional users while import
   * @property workspaceId: string
   * @property userId: string
   * @property workspaceSlug: string
   */
  async getAdditionalUsers(
    workspaceId: string,
    userId: string,
    workspaceSlug: string,
    teamId: string
  ): Promise<IAdditionalUsersResponse | undefined> {
    return this.axiosInstance
      .get(
        `/api/${E_IMPORTER_KEYS.LINEAR.toLowerCase().replaceAll("_", "-")}/additional-users/${workspaceId}/${workspaceSlug}/${userId}/${teamId}`,
        {}
      )
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
