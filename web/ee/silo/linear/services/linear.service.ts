import axios, { AxiosInstance } from "axios";
import { LinearTeam, LinearState } from "@silo/linear";

export class LinearService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * @description get teams
   * @property workspaceId: string
   * @property userId: string
   * @returns teams | undefined
   */
  async getTeams(workspaceId: string, userId: string): Promise<LinearTeam[] | undefined> {
    return this.axiosInstance
      .post(`/silo/api/linear/teams`, { workspaceId, userId })
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
      .post(`/silo/api/linear/team-states`, { workspaceId, userId, teamId })
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
      .post(`/silo/api/linear/team-issue-count`, { workspaceId, userId, teamId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
