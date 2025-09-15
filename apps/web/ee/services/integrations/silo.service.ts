import axios, { AxiosInstance } from "axios";
import { E_INTEGRATION_KEYS } from "@plane/types";

export class SiloAppService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  async getSupportedIntegrations(): Promise<E_INTEGRATION_KEYS[]> {
    return this.axiosInstance
      .get(`/api/supported-integrations/`)
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
