// helpers
import { API_BASE_URL } from "helpers/common.helper";
// services
import { APIService } from "services/api.service";
// types
import type { IInstance } from "@plane/types";

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
}
