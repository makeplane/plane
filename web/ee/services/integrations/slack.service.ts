import axios, { AxiosInstance } from "axios";
// types
import {
  SlackAuthState,
  SlackUserAuthState,
  TAppConnection,
  TSlackConfig,
  TSlackConnectionData,
  TSlackProjectUpdatesConfig,
  TUserConnectionStatus,
} from "@plane/etl/slack";
import { TWorkspaceConnection, TWorkspaceEntityConnection } from "@plane/types";

export class SlackIntegrationService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description get the app installation url
   * @param { SlackAuthState } payload
   * @returns { Promise<string> }
   */
  async getAppInstallationURL(payload: SlackAuthState): Promise<string> {
    return this.axiosInstance
      .post(`/api/slack/app/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get the user connection url
   * @param { SlackAuthState } payload
   * @returns { Promise<string> }
   */
  async getUserConnectionURL(payload: SlackUserAuthState): Promise<string> {
    return this.axiosInstance
      .post(`/api/slack/user/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get the app connection status
   * @param { string } workspaceId
   * @returns { Promise<TAppConnection[]> }
   */
  async getAppConnection(workspaceId: string): Promise<TWorkspaceConnection<TSlackConfig, TSlackConnectionData>[]> {
    return this.axiosInstance
      .get(`/api/slack/app/status/${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get the user connection status
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<TUserConnectionStatus> }
   */
  async getUserConnectionStatus(workspaceId: string, userId: string): Promise<TUserConnectionStatus> {
    return this.axiosInstance
      .get(`/api/slack/user/status/${workspaceId}/${userId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description disconnect the app
   * @param { string } workspaceId
   * @param { string } connectionId
   * @returns { Promise<void> }
   */
  async disconnectApp(workspaceId: string, connectionId: string): Promise<void> {
    return this.axiosInstance
      .post(`/api/slack/app/disconnect`, { workspaceId, connectionId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description disconnect the user
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void> }
   */
  async disconnectUser(workspaceId: string, userId: string): Promise<void> {
    return this.axiosInstance
      .post(`/api/slack/user/disconnect`, { workspaceId, userId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get the projects connected to channel
   * @param { string } workspaceId
   * @returns { Promise<TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>[]> }
   */
  async getProjectConnections(workspaceId: string): Promise<TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>[]> {
    return this.axiosInstance
      .get(`/api/slack/updates/projects/${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description create the project connection
   * @param { string } workspaceId
   * @param { TWorkspaceEntityConnection<TSlackProjectUpdatesConfig> } projectConnection
   * @returns { Promise<void> }
   */
  async createProjectConnection(
    workspaceId: string,
    projectConnection: TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>
  ): Promise<void> {
    return this.axiosInstance
      .post(`/api/slack/updates/projects/${workspaceId}`, projectConnection)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description update the project connection
   * @param { string } id
   * @param { TWorkspaceEntityConnection<TSlackProjectUpdatesConfig> } projectConnection
   * @returns { Promise<void> }
   */
  async updateProjectConnection(
    id: string,
    projectConnection: TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>
  ): Promise<void> {
    return this.axiosInstance
      .put(`/api/slack/updates/projects/${id}`, projectConnection)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description delete the project connection
   * @param { string } id
   * @returns { Promise<void> }
   */
  async deleteProjectConnection(id: string): Promise<void> {
    return this.axiosInstance
      .delete(`/api/slack/updates/projects/${id}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get the channels
   * @param { string } workspaceId
   * @returns { Promise<TWorkspaceEntityConnection<TSlackProjectUpdatesConfig>[]> }
   */
  async getChannels(teamId: string, params?: { onlyChannels?: boolean }) {
    return this.axiosInstance
      .get(`/api/slack/channels/${teamId}`, { params })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
