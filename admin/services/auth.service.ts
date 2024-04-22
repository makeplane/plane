// services
import { APIService } from "services/api.service";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

type TCsrfTokenResponse = {
  csrf_token: string;
};

export class AuthService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async requestCSRFToken(): Promise<TCsrfTokenResponse> {
    return this.get<TCsrfTokenResponse>("/auth/get-csrf-token/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async signOut(baseUrl: string): Promise<any> {
    await this.requestCSRFToken().then((data) => {
      const csrfToken = data?.csrf_token;

      if (!csrfToken) throw Error("CSRF token not found");

      var form = document.createElement("form");
      var element1 = document.createElement("input");

      form.method = "POST";
      form.action = `${baseUrl}/api/instances/admins/sign-out/`;

      element1.value = csrfToken;
      element1.name = "csrfmiddlewaretoken";
      element1.type = "hidden";
      form.appendChild(element1);

      document.body.appendChild(form);

      form.submit();
    });
  }
}
