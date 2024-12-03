import axios, { AxiosInstance } from "axios";
import { LinearAuthState } from "@silo/linear";

export class ImporterAuthService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * @description authenticate the service
   * @property payload: LinearAuthState
   * @redirects to the linear authentication URL
   */
  async linearAuthentication(payload: LinearAuthState) {
    return this.axiosInstance
      .post(`/api/linear/auth/url`, payload)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
