// services
import axios from "axios";
import APIService from "services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class OidcService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getSettings(): Promise<any> {
    const response = await axios({
      method: "get",
      url: "/api/oidc-settings",
    });

    return response.data;
  }
}

export default new OidcService();
