import axios, { AxiosInstance } from "axios";
import { GitLabAuthorizeState } from "@plane/etl/gitlab";
// plane web types
import { TGitlabWorkspaceConnection, TGitlabAppConfig } from "@plane/types";

export class GitlabAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string, isEnterprise: boolean = false) {
    this.baseURL = isEnterprise ? `${baseURL}/api/oauth/gitlab-enterprise` : `${baseURL}/api/gitlab`;
    this.axiosInstance = axios.create({ baseURL: this.baseURL, withCredentials: true });
  }

  /**
   * @description fetch organization
   * @param { string } workspaceId
   * @returns { Promise<TGitlabWorkspaceConnection[] | undefined> }
   */
  fetchOrganizationConnection = async (workspaceId: string): Promise<TGitlabWorkspaceConnection[] | undefined> =>
    await this.axiosInstance
      .get(`/auth/organization-status/${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description connect organization
   * @param { GitLabAuthorizeState } payload
   * @returns { Promise<string> }
   */
  connectOrganization = async (payload: GitLabAuthorizeState): Promise<string> =>
    await this.axiosInstance
      .post(`/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description disconnect organization
   * @param { string } workspaceId
   * @param { string } organizationId
   * @returns { Promise<void> }
   */
  disconnectOrganization = async (workspaceId: string, organizationId: string): Promise<void> =>
    await this.axiosInstance
      .post(`/auth/organization-disconnect/${workspaceId}/${organizationId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description get plane app details
   * @returns { Promise<{ appId: string; clientId: string }> }
   */
  getPlaneAppDetails = async (): Promise<{ appId: string; clientId: string }> =>
    await this.axiosInstance
      .get(`/plane-app-details`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description fetch app config key
   * @param { string } workspaceId
   * @param { TGitlabAppConfig } config
   * @returns { Promise<string> }
   */
  fetchAppConfigKey = async (workspaceId: string, config: TGitlabAppConfig): Promise<{ configKey: string }> =>
    await this.axiosInstance
      .post(`/auth/config-key/${workspaceId}`, { config })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
