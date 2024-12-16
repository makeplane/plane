import axios, { AxiosInstance } from "axios";
import { GithubAuthorizeState } from "@silo/github";

export class IntegrationAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * @description authenticate the github organization
   * @param { GithubAuthorizeState } payload
   * @redirects to the Github authentication URL
   */
  async githubOrganizationAuthentication(payload: GithubAuthorizeState) {
    return this.axiosInstance
      .post(`/silo/api/github/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description authenticate the github personal account
   * @param { GithubAuthorizeState } payload
   * @redirects to the Github authentication URL
   */
  async githubPersonalAccountAuthentication(payload: GithubAuthorizeState) {
    return this.axiosInstance
      .post(`/silo/api/github/auth/user/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
