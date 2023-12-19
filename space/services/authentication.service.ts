// services
import APIService from "services/api.service";
import { API_BASE_URL } from "helpers/common.helper";
import { IEmailCheckData, IEmailCheckResponse, ILoginTokenResponse, IPasswordSignInData } from "types/auth";

export class AuthService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async emailCheck(data: IEmailCheckData): Promise<IEmailCheckResponse> {
    return this.post("/api/email-check/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async emailLogin(data: any) {
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

  async emailSignUp(data: { email: string; password: string }) {
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

  async socialAuth(data: any): Promise<{
    access_token: string;
    refresh_toke: string;
    user: any;
  }> {
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

  async passwordSignIn(data: IPasswordSignInData): Promise<ILoginTokenResponse> {
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

  async sendResetPasswordLink(data: { email: string }): Promise<any> {
    return this.post(`/api/forgot-password/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async emailCode(data: any) {
    return this.post("/api/magic-generate/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async forgotPassword(data: { email: string }): Promise<any> {
    return this.post(`/api/forgot-password/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async magicSignIn(data: any) {
    const response = await this.post("/api/magic-sign-in/", data, { headers: {} });
    if (response?.status === 200) {
      this.setAccessToken(response?.data?.access_token);
      this.setRefreshToken(response?.data?.refresh_token);
      return response?.data;
    }
    throw response.response.data;
  }

  async generateUniqueCode(data: { email: string }): Promise<any> {
    return this.post("/api/magic-generate/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async resetPassword(
    uidb64: string,
    token: string,
    data: {
      new_password: string;
    }
  ): Promise<ILoginTokenResponse> {
    return this.post(`/api/reset-password/${uidb64}/${token}/`, data, { headers: {} })
      .then((response) => {
        if (response?.status === 200) {
          this.setAccessToken(response?.data?.access_token);
          this.setRefreshToken(response?.data?.refresh_token);
          return response?.data;
        }
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async setPassword(data: { password: string }): Promise<any> {
    return this.post(`/api/users/me/set-password/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async signOut() {
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
