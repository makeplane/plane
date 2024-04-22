// services
import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "@/services/api.service";
// helpers
// types
import {
  ICsrfTokenData,
  IEmailCheckData,
  IEmailCheckResponse,
  ILoginTokenResponse,
  IMagicSignInData,
  IPasswordSignInData,
} from "@plane/types";

export class AuthService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async requestCSRFToken(): Promise<ICsrfTokenData> {
    return this.get("/auth/get-csrf-token/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async signUpEmailCheck(data: IEmailCheckData): Promise<IEmailCheckResponse> {
    return this.post("/auth/sign-up/email-check/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async signInEmailCheck(data: IEmailCheckData): Promise<IEmailCheckResponse> {
    return this.post("/auth/sign-in/email-check/", data, { headers: {} })
      .then((response) => response?.data)
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

  async setPassword(data: { password: string }): Promise<any> {
    return this.post(`/api/users/me/set-password/`, data)
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

  async generateUniqueCode(data: { email: string }): Promise<any> {
    return this.post("/auth/magic-generate/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async magicSignIn(data: IMagicSignInData): Promise<any> {
    return await this.post("/api/magic-sign-in/", data, { headers: {} })
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

  async instanceAdminSignIn(data: IPasswordSignInData): Promise<ILoginTokenResponse> {
    return await this.post("/api/instances/admins/sign-in/", data, { headers: {} })
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

  async signOut(baseUrl: string): Promise<any> {
    await this.requestCSRFToken().then((data) => {
      const csrfToken = data?.csrf_token;

      if (!csrfToken) throw Error("CSRF token not found");

      var form = document.createElement("form");
      var element1 = document.createElement("input");

      form.method = "POST";
      form.action = `${baseUrl}/auth/sign-out/`;

      element1.value = csrfToken;
      element1.name = "csrfmiddlewaretoken";
      element1.type = "hidden";
      form.appendChild(element1);

      document.body.appendChild(form);

      form.submit();
    });
  }
}
