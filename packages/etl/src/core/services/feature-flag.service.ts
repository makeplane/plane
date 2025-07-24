import axios, { AxiosInstance } from "axios";
// types
import { TFeatureFlags } from "@/core/types";

export class FeatureFlagService {
  public axiosInstance: AxiosInstance;

  constructor(baseURL: string, config?: { x_api_key: string }) {
    this.axiosInstance = axios.create({ baseURL });
    this.axiosInstance.defaults.headers.common["x-api-key"] = config?.x_api_key;
  }

  async featureFlags(payload: { workspace_slug: string; user_id: string; flag_key: TFeatureFlags }): Promise<boolean> {
    return this.axiosInstance
      .post(`/api/feature-flags/`, payload)
      .then((response) => response?.data?.value)
      .catch(() => false);
  }
}
