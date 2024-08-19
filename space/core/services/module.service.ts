import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
import { TPublicModule } from "@/types/modules";

export class ModuleService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getModules(anchor: string): Promise<TPublicModule[]> {
    return this.get(`/api/public/anchor/${anchor}/modules/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
