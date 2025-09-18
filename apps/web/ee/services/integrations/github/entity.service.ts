import axios, { AxiosInstance } from "axios";
// plane web types
import { TGithubEntityConnection } from "@plane/types";

export class GithubEntityService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description fetch entity connections
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @returns { Promise<TGithubEntityConnection[] | undefined> }
   */
  fetchEntityConnections = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityType?: string
  ): Promise<TGithubEntityConnection[] | undefined> =>
    await this.axiosInstance
      .get(`/api/entity-connections/${workspaceId}/${workspaceConnectionId}`, {
        params: { entityType },
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description fetch entity connection
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { string } entityId
   * @returns { Promise<TGithubEntityConnection | undefined> }
   */
  fetchEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityId: string
  ): Promise<TGithubEntityConnection | undefined> =>
    await this.axiosInstance
      .get(`/api/entity-connections/${workspaceId}/${workspaceConnectionId}/${entityId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description create entity connection
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { Partial<TGithubEntityConnection> } entityConnection
   * @returns { Promise<TGithubEntityConnection | undefined> }
   */
  createEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityConnection: Partial<TGithubEntityConnection>
  ): Promise<TGithubEntityConnection | undefined> =>
    await this.axiosInstance
      .post(`/api/entity-connections/${workspaceId}/${workspaceConnectionId}`, entityConnection)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description update entity connection
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { string } entityId
   * @param { Partial<TGithubEntityConnection> } entityConnection
   * @returns { Promise<TGithubEntityConnection | undefined> }
   */
  updateEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityId: string,
    entityConnection: Partial<TGithubEntityConnection>
  ): Promise<TGithubEntityConnection | undefined> =>
    await this.axiosInstance
      .put(`/api/entity-connections/${workspaceId}/${workspaceConnectionId}/${entityId}`, entityConnection)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description delete entity connection
   * @param { string } workspaceId
   * @param { string } workspaceConnectionId
   * @param { string } entityId
   * @returns { Promise<void> }
   */
  deleteEntityConnection = async (
    workspaceId: string,
    workspaceConnectionId: string,
    entityId: string
  ): Promise<void> =>
    await this.axiosInstance
      .delete(`/api/entity-connections/${workspaceId}/${workspaceConnectionId}/${entityId}`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
}
