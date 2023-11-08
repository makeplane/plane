// services
import APIService from "services/api.service";
// helper
import { API_BASE_URL } from "helpers/common.helper";

export interface IAppConfig {
  email_password_login: boolean;
  google_client_id: string | null;
  github_app_name: string | null;
  github_client_id: string | null;
  magic_login: boolean;
  slack_client_id: string | null;
}

export class AppConfigService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async envConfig(): Promise<IAppConfig> {
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
