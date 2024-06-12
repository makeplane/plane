// services
import { APIService } from "@/services/api.service";

export class DiscoService extends APIService {
  constructor() {
    super("/disco");
  }

  listProducts(): Promise<any> {
    return this.get("/api/products/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
