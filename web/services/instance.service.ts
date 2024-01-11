import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import type { IFormattedInstanceConfiguration, IInstance, IInstanceAdmin, IInstanceConfiguration } from "@plane/types";

export class InstanceService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getInstanceInfo(): Promise<IInstance> {
    return this.get("/api/instances/", { headers: {} })
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async getInstanceAdmins(): Promise<IInstanceAdmin[]> {
    return this.get("/api/instances/admins/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async updateInstanceInfo(data: Partial<IInstance>): Promise<IInstance> {
    return this.patch("/api/instances/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getInstanceConfigurations() {
    return this.get("/api/instances/configurations/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async updateInstanceConfigurations(
    data: Partial<IFormattedInstanceConfiguration>
  ): Promise<IInstanceConfiguration[]> {
    return this.patch("/api/instances/configurations/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
