import axios, { AxiosInstance } from "axios";
import { TUserWorkspaceConnection } from "../types";

export class ConnectionService {
  public axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({ baseURL });
  }

  async getUserConnections(workspaceId: string, userId: string): Promise<TUserWorkspaceConnection<any>[]> {
    try {
      const connections = await this.axiosInstance.get(`/api/connections/${workspaceId}/user/${userId}`);
      return connections.data;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
