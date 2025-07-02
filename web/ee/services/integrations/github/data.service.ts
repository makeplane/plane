import axios, { AxiosInstance } from "axios";
// plane web types
import { TGithubRepository } from "@/plane-web/types/integrations";

export class GithubDataService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string, isEnterprise: boolean = false) {
    this.baseURL = `${baseURL}/api/${isEnterprise ? "github-enterprise" : "github"}`;
    this.axiosInstance = axios.create({ baseURL: this.baseURL, withCredentials: true });
  }

  /**
   * @description fetch github repositories
   * @param { string } workspaceId
   * @returns { Promise<TGithubRepository[] | undefined> }
   */
  fetchGithubRepositories = async (workspaceId: string): Promise<TGithubRepository[] | undefined | undefined> =>
    await this.axiosInstance
      .get(`/${workspaceId}/repos`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
