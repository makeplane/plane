// api routes
import {
  SIGN_IN_ENDPOINT,
  SOCIAL_AUTH_ENDPOINT,
  MAGIC_LINK_GENERATE,
  MAGIC_LINK_SIGNIN,
} from "constants/api-routes";
// services
import APIService from "lib/services/api.service";

class AuthService extends APIService {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async emailLogin(data: any) {
    return this.post(SIGN_IN_ENDPOINT, data, { headers: {} })
      .then((response) => {
        this.setAccessToken(response?.data?.access_token);
        this.setRefreshToken(response?.data?.refresh_token);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async socialAuth(data: any) {
    return this.post(SOCIAL_AUTH_ENDPOINT, data, { headers: {} })
      .then((response) => {
        this.setAccessToken(response?.data?.access_token);
        this.setRefreshToken(response?.data?.refresh_token);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async emailCode(data: any) {
    return this.post(MAGIC_LINK_GENERATE, data, { headers: {} })
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async magicSignIn(data: any) {
    const response = await this.post(MAGIC_LINK_SIGNIN, data, { headers: {} });
    if (response?.status === 200) {
      this.setAccessToken(response?.data?.access_token);
      this.setRefreshToken(response?.data?.refresh_token);
      return response?.data;
    }
    throw response.response.data;
  }

  async signOut(data = {}) {
    return this.post("/api/sign-out/", data)
      .then((response) => {
        this.purgeAccessToken();
        this.purgeRefreshToken();
        return response?.data;
      })
      .catch((error) => {
        this.purgeAccessToken();
        this.purgeRefreshToken();
        throw error?.response?.data;
      });
  }
}

export default new AuthService();
