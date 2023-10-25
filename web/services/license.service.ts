// services
import { APIService } from "services/api.service";

export class LicenseService extends APIService {
  constructor() {
    super("http://localhost:8080");
  }

  async getProducts(): Promise<any[]> {
    return this.get(`/api/products/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
