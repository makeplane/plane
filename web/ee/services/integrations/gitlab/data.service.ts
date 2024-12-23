import axios, { AxiosInstance } from "axios";
// plane web types
import { TGitlabRepository } from "@/plane-web/types/integrations/gitlab";

export class GitlabDataService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * @description fetch gitlab repositories
   * @param { string } workspaceId
   * @returns { Promise<TGitlabRepository[] | undefined> }
   */
  fetchGitlabRepositories = async (workspaceId: string): Promise<TGitlabRepository[] | undefined | undefined> =>
    await this.axiosInstance
      .get(`/api/gitlab/${workspaceId}/repos`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
}
