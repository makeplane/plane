import axios, { AxiosInstance } from "axios";
import { E_IMPORTER_KEYS, TServiceAuthConfiguration } from "@plane/etl/core";
import { JiraAuthState, JiraPATAuthState } from "@plane/etl/jira";

export class JiraServerAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description validate the jira importer is authenticated or not
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async jiraAuthVerification(workspaceId: string, userId: string): Promise<TServiceAuthConfiguration | undefined> {
    console.log("workspaceId coming here:", workspaceId);
    return this.axiosInstance
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${E_IMPORTER_KEYS.JIRA_SERVER}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description api_token verification
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } externalApiToken
   * @returns { Promise<{ message: string } | undefined> }
   */
  async jiraApiTokenVerification(
    workspaceId: string,
    userId: string,
    externalApiToken: string
  ): Promise<{ message: string } | undefined> {
    return this.axiosInstance
      .post(
        `/api/credentials/${workspaceId}/${userId}/token-verify/?source=${E_IMPORTER_KEYS.JIRA_SERVER}&token=${externalApiToken}`
      )
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description authenticate the service via oAuth
   * @property payload: JiraAuthState
   * @returns { Promise<string | undefined> } the oAuth url
   */
  async jiraAuthentication(payload: JiraAuthState): Promise<string | undefined> {
    return this.axiosInstance
      .post(`/api/jira/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description authenticate the service via PAT
   * @property payload: JiraPATAuthState
   * @returns the authenticated user details
   * @returns { Promise<void | undefined> }
   */
  async jiraPATAuthentication(payload: JiraPATAuthState): Promise<void | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/auth/pat`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description deactivates the jira importer auth
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async jiraAuthDeactivate(workspaceId: string, userId: string): Promise<void | undefined> {
    return this.axiosInstance
      .post(`/api/credentials/${workspaceId}/${userId}/deactivate/?source=${E_IMPORTER_KEYS.JIRA_SERVER}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
