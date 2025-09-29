import axios, { AxiosInstance } from "axios";
// plane web types
import { IGitlabEntity } from "@plane/etl/gitlab";
import { TGitlabRepository } from "@plane/types";

export class GitlabDataService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string, isEnterprise: boolean = false) {
    this.baseURL = `${baseURL}/api/${isEnterprise ? "gitlab-enterprise" : "gitlab"}`;
    this.axiosInstance = axios.create({ baseURL: this.baseURL, withCredentials: true });
  }

  /**
   * @description fetch gitlab repositories
   * @param { string } workspaceId
   * @returns { Promise<TGitlabRepository[] | undefined> }
   */
  fetchGitlabRepositories = async (workspaceId: string): Promise<TGitlabRepository[] | undefined | undefined> =>
    await this.axiosInstance
      .get(`/${workspaceId}/repos`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  /**
   * @description fetch gitlab entities
   * @param { string } workspaceId
   * @returns { Promise<IGitlabEntity[]> }
   */
  fetchGitlabEntities = async (workspaceId: string): Promise<IGitlabEntity[]> =>
    await this.axiosInstance
      .get(`/entities/${workspaceId}`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
