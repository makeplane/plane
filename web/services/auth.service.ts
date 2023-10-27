// services
import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export interface ILoginTokenResponse {
  access_token: string;
  refresh_toke: string;
}

export class AuthService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async emailLogin(data: any): Promise<ILoginTokenResponse> {
    return this.post("/api/sign-in/", data, { headers: {} })
      .then((response) => {
        this.setAccessToken(response?.data?.access_token);
        this.setRefreshToken(response?.data?.refresh_token);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async emailSignUp(data: { email: string; password: string }): Promise<ILoginTokenResponse> {
    return this.post("/api/sign-up/", data, { headers: {} })
      .then((response) => {
        this.setAccessToken(response?.data?.access_token);
        this.setRefreshToken(response?.data?.refresh_token);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async socialAuth(data: any): Promise<ILoginTokenResponse> {
    return this.post("/api/social-auth/", data, { headers: {} })
      .then((response) => {
        this.setAccessToken(response?.data?.access_token);
        this.setRefreshToken(response?.data?.refresh_token);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async emailCode(data: any): Promise<any> {
    return this.post("/api/magic-generate/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async magicSignIn(data: any): Promise<any> {
    const response = await this.post("/api/magic-sign-in/", data, { headers: {} });
    if (response?.status === 200) {
      this.setAccessToken(response?.data?.access_token);
      this.setRefreshToken(response?.data?.refresh_token);
      return response?.data;
    }
    throw response.response.data;
  }

  async signOut(): Promise<any> {
    return this.post("/api/sign-out/", { refresh_token: this.getRefreshToken() })
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
