import axios, { AxiosInstance } from "axios";
import { GitLabAuthorizeState } from "@plane/etl/gitlab";
// plane web types
import { TGitlabWorkspaceConnection } from "@/plane-web/types/integrations/gitlab";

export class GitlabAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description fetch organization
   * @param { string } workspaceId
   * @returns { Promise<TGitlabWorkspaceConnection[] | undefined> }
   */
  fetchOrganizationConnection = async (workspaceId: string): Promise<TGitlabWorkspaceConnection[] | undefined> =>
    await this.axiosInstance
      .get(`/api/gitlab/auth/organization-status/${workspaceId}`)
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
      .post(`/api/gitlab/auth/url`, payload)
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
      .post(`/api/gitlab/auth/organization-disconnect/${workspaceId}/${organizationId}`)
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
      .get(`/api/gitlab/plane-app-details`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
