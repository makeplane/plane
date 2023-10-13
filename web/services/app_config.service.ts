// services
import { APIService } from "services/api.service";
// helper
import { API_BASE_URL } from "helpers/common.helper";

export interface IEnvConfig {
  github: string;
  google: string;
  github_app_name: string | null;
  email_password_login: boolean;
  magic_login: boolean;
}

export class AppConfigService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async envConfig(): Promise<IEnvConfig> {
    return this.get("/api/configs/", {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
