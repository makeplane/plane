import axios, { AxiosInstance } from "axios";
import { TClickUpAuthState } from "@plane/etl/clickup";
import { TServiceAuthConfiguration, E_IMPORTER_KEYS } from "@plane/etl/core";

export class ClickUpAuthService {
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
  async clickUpAuthVerification(workspaceId: string, userId: string): Promise<TServiceAuthConfiguration | undefined> {
    return this.axiosInstance
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${E_IMPORTER_KEYS.CLICKUP}`)
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
  async clickUpPATAuthentication(payload: TClickUpAuthState): Promise<void | undefined> {
    return this.axiosInstance
      .post(`/api/clickup/auth/pat`, payload)
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
  async clickUpAuthDeactivate(workspaceId: string, userId: string): Promise<void | undefined> {
    return this.axiosInstance
      .post(`/api/credentials/${workspaceId}/${userId}/deactivate/?source=${E_IMPORTER_KEYS.CLICKUP}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get plane app details
   * @returns { Promise<{ appId: string; clientId: string }> }
   */
  getPlaneClickUpAppDetails = async (): Promise<{ appId: string; clientId: string }> =>
    await this.axiosInstance
      .get(`/api/plane-app-details/${E_IMPORTER_KEYS.IMPORTER}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
