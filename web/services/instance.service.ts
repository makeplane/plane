import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";
// types
import type { IInstance } from "types/instance";

export class InstanceService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getInstanceInfo(): Promise<IInstance> {
    return this.get("/api/licenses/instances/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async updateInstanceInfo(
    data: Partial<IInstance>
  ): Promise<IInstance> {
    return this.patch("/api/licenses/instances/", data)
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    })
  }

  async getInstanceConfigurations() {
    return this.get("/api/licenses/instances/configurations/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }
}
