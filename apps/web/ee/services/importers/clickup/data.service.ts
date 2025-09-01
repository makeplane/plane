import axios, { AxiosInstance } from "axios";
import { TClickUpFolder, TClickUpSpace, TClickUpTeam } from "@plane/etl/clickup";
import { IAdditionalUsersResponse } from "@plane/types";

export class ClickUpDataService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = `${baseURL}/api/clickup`;
    this.axiosInstance = axios.create({ baseURL: this.baseURL, withCredentials: true });
  }

  /**
   * @description get teams
   * @property workspaceId: string
   * @property userId: string
   * @returns teams | undefined
   */
  async getTeams(workspaceId: string, userId: string): Promise<TClickUpTeam[] | undefined> {
    return this.axiosInstance
      .get(`/team`, { params: { workspaceId, userId } })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get spaces
   * @property workspaceId: string
   * @property userId: string
   * @property teamId: string
   * @returns spaces | undefined
   */
  async getSpaces(workspaceId: string, userId: string, teamId: string): Promise<TClickUpSpace[] | undefined> {
    return this.axiosInstance
      .get(`/space`, { params: { workspaceId, userId, teamId } })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project states
   * @property workspaceId: string
   * @property userId: string
   * @property resourceId: string
   * @property projectId: string
   * @returns states | undefined
   */
  async getFolders(workspaceId: string, userId: string, spaceId: string): Promise<TClickUpFolder[] | undefined> {
    return this.axiosInstance
      .get(`/folder`, { params: { workspaceId, userId, spaceId } })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get folder task count
   * @property workspaceId: string
   * @property userId: string
   * @property folderId: string
   * @returns task count | undefined
   */
  async getFolderTaskCount(
    workspaceId: string,
    userId: string,
    folderId: string
  ): Promise<{ taskCount: number } | undefined> {
    return this.axiosInstance
      .get(`/folder/${folderId}/task-count`, { params: { workspaceId, userId } })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get additional users
   * @property workspaceId: string
   * @property userId: string
   * @property workspaceSlug: string
   * @property teamId: string
   */
  async getAdditionalUsers(
    workspaceId: string,
    userId: string,
    workspaceSlug: string,
    teamId: string
  ): Promise<IAdditionalUsersResponse | undefined> {
    return this.axiosInstance
      .get(`/additional-users/${workspaceId}/${workspaceSlug}/${userId}/${teamId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
