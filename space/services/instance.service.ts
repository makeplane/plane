// types
import type { IInstance } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import APIService from "@/services/api.service";

export class InstanceService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getInstanceInfo(): Promise<IInstance> {
    return this.get("/api/instances/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }
}
