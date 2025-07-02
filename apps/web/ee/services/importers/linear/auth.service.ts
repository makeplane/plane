import axios, { AxiosInstance } from "axios";
import { E_IMPORTER_KEYS, TServiceAuthConfiguration } from "@plane/etl/core";
import { LinearAuthState, LinearPATAuthState } from "@plane/etl/linear";

export class LinearAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description validate the linear importer is authenticated or not
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async linearAuthVerification(workspaceId: string, userId: string): Promise<TServiceAuthConfiguration | undefined> {
    return this.axiosInstance
      .get(`/api/credentials/${workspaceId}/${userId}/?source=${E_IMPORTER_KEYS.LINEAR}`)
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
  async linearApiTokenVerification(
    workspaceId: string,
    userId: string,
    externalApiToken: string
  ): Promise<{ message: string } | undefined> {
    return this.axiosInstance
      .post(
        `/api/credentials/${workspaceId}/${userId}/token-verify/?source=${E_IMPORTER_KEYS.LINEAR}&token=${externalApiToken}`
      )
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description authenticate the service via oAuth
   * @property payload: LinearAuthState
   * @returns { Promise<string | undefined> } the oAuth url
   */
  async linearAuthentication(payload: LinearAuthState): Promise<string | undefined> {
    return this.axiosInstance
      .post(`/api/linear/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description authenticate the service via PAT
   * @property payload: LinearPATAuthState
   * @returns the authenticated user details
   * @returns { Promise<void | undefined> }
   */
  async linearPATAuthentication(payload: LinearPATAuthState): Promise<void | undefined> {
    return this.axiosInstance
      .post(`/api/linear/auth/pat`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description deactivates the linear importer auth
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<void | undefined> }
   */
  async linearAuthDeactivate(workspaceId: string, userId: string): Promise<void | undefined> {
    return this.axiosInstance
      .post(`/api/credentials/${workspaceId}/${userId}/deactivate/?source=${E_IMPORTER_KEYS.LINEAR}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
