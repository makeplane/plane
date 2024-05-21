// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class DashboardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  listProducts(): Promise<any> {
    return this.get("/api/products/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
