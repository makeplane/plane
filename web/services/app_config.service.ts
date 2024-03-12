// helpers
import { API_BASE_URL } from "helpers/common.helper";
// services
import { APIService } from "services/api.service";
// types
// FIXME:
// import { TAppConfig } from "@plane/types";

export class AppConfigService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async envConfig(): Promise<any> {
    return this.get("/api/configs/", {
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
