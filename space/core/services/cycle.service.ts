import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";
// types
import { TPublicCycle } from "@/types/cycle";

export class CycleService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getCycles(anchor: string): Promise<TPublicCycle[]> {
    return this.get(`/api/public/anchor/${anchor}/cycles/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
