import axios, { AxiosInstance } from "axios";
// import { GithubAuthorizeState } from "@silo/github";

export class GitHubService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * 1. Fetching the GitHub user details
   * 2. Fetching the GitHub organization details
   * 3. Fetching the GitHub organization repositories
   * 4.
   */
}
