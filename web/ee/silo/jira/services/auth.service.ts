import axios, { AxiosInstance } from "axios";
import { JiraAuthState } from "@silo/jira";

export class ImporterAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * @description authenticate the service
   * @property payload: JiraAuthState
   * @redirects to the Jira authentication URL
   */
  async jiraAuthentication(payload: JiraAuthState) {
    return this.axiosInstance
      .post(`/silo/api/jira/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
