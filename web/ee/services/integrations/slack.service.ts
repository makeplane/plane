import axios, { AxiosInstance } from "axios";
// types
import { SlackAuthState, TAppConnection, TUserConnectionStatus } from "@silo/slack";

export class SlackIntegrationService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
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
  async getUserConnectionURL(payload: SlackAuthState): Promise<string> {
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
   * @returns { Promise<SlackAuthState[]> }
   */
  async getAppConnection(workspaceId: string): Promise<TAppConnection[]> {
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
}
