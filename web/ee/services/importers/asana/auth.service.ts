import axios, { AxiosInstance } from "axios";
import { AsanaAuthState, AsanaPATAuthState } from "@plane/etl/asana";
import { E_IMPORTER_KEYS, TServiceAuthConfiguration } from "@plane/etl/core";

export class AsanaAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description verify the asana importer is authenticated or not
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<TServiceAuthConfiguration | undefined> }
   */
  async asanaAuthVerification(workspaceId: string, userId: string): Promise<TServiceAuthConfiguration | undefined> {
    return this.axiosInstance
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${E_IMPORTER_KEYS.ASANA}`)
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
  async asanaApiTokenVerification(
    workspaceId: string,
    userId: string,
    externalApiToken: string
  ): Promise<{ message: string } | undefined> {
    return this.axiosInstance
      .post(
        `/api/credentials/${workspaceId}/${userId}/token-verify/?source=${E_IMPORTER_KEYS.ASANA}&token=${externalApiToken}`
      )
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description authenticate the service
   * @property payload: AsanaAuthState
   *
   * @redirects to the asana authentication URL
   */
  async asanaAuthentication(payload: AsanaAuthState) {
    return this.axiosInstance
      .post(`/api/asana/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description authenticate the service via PAT
   * @property payload: AsanaPATAuthState
   * @returns the authenticated user details
   * @returns { Promise<void | undefined> }
   */
  async asanaPATAuthentication(payload: AsanaPATAuthState) {
    return this.axiosInstance
      .post(`/api/asana/auth/pat`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description deactivates the asana importer auth
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async asanaAuthDeactivate(workspaceId: string, userId: string): Promise<void | undefined> {
    return this.axiosInstance
      .post(`/api/credentials/${workspaceId}/${userId}/deactivate/?source=${E_IMPORTER_KEYS.ASANA}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
