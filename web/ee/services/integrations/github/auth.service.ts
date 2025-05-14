import axios, { AxiosInstance } from "axios";
import { GithubAuthorizeState, GithubUserAuthState } from "@plane/etl/github";
// plane web types
import { TGithubWorkspaceConnection, TGithubWorkspaceUserConnection } from "@/plane-web/types/integrations";

export class GithubAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description fetch organization
   * @param { string } workspaceId
   * @returns { Promise<TGithubWorkspaceConnection[] | undefined> }
   */
  fetchOrganizationConnection = async (workspaceId: string): Promise<TGithubWorkspaceConnection[] | undefined> =>
    await this.axiosInstance
      .get(`/api/github/auth/organization-status/${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description connect organization
   * @param { GithubAuthorizeState } payload
   * @returns { Promise<string> }
   */
  connectOrganization = async (payload: GithubAuthorizeState): Promise<string> =>
    await this.axiosInstance
      .post(`/api/github/auth/url`, payload)
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
  disconnectOrganization = async (workspaceId: string, organizationId: string, userId: string): Promise<void> =>
    await this.axiosInstance
      .post(`/api/github/auth/organization-disconnect/${workspaceId}/${organizationId}/${userId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description fetch user
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<TGithubWorkspaceUserConnection[] | undefined> }
   */
  fetchUserConnection = async (
    workspaceId: string,
    userId: string
  ): Promise<TGithubWorkspaceUserConnection | undefined> =>
    await this.axiosInstance
      .get(`/api/github/auth/user-status/${workspaceId}/${userId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description connect user
   * @param { GithubUserAuthState } payload
   * @returns { Promise<string> }
   */
  connectUser = async (payload: GithubUserAuthState): Promise<string> =>
    await this.axiosInstance
      .post(`/api/github/auth/user/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description disconnect user
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void> }
   */
  disconnectUser = async (workspaceId: string, userId: string): Promise<void> =>
    await this.axiosInstance
      .post(`/api/github/auth/user-disconnect/${workspaceId}/${userId}`)
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
      .get(`/api/github/plane-app-details`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
