import { API_BASE_URL } from "@plane/constants";
// types
import type { ICsrfTokenData, IEmailCheckData, IEmailCheckResponse } from "@plane/types";
// services
import { APIService } from "../api.service";

/**
 * Service class for handling authentication-related operations
 * Provides methods for user authentication, password management, and session handling
 * @extends {APIService}
 */
export class AuthService extends APIService {
  /**
   * Creates an instance of AuthService
   * Initializes with the base API URL
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Requests a CSRF token for form submission security
   * @returns {Promise<ICsrfTokenData>} Object containing the CSRF token
   * @throws {Error} Throws the complete error object if the request fails
   * @remarks This method uses the validateStatus: null option to bypass interceptors for unauthorized errors.
   */
  async requestCSRFToken(): Promise<ICsrfTokenData> {
    return this.get("/auth/get-csrf-token/", { validateStatus: null })
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  /**
   * Checks if an email exists in the system
   * @param {IEmailCheckData} data - Email data to verify
   * @returns {Promise<IEmailCheckResponse>} Response indicating email status
   * @throws {Error} Throws response data if the request fails
   */
  async emailCheck(data: IEmailCheckData): Promise<IEmailCheckResponse> {
    return this.post("/auth/email-check/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Sends a password reset link to the specified email address
   * @param {{ email: string }} data - Object containing the email address
   * @returns {Promise<any>} Response from the password reset request
   * @throws {Error} Throws response object if the request fails
   */
  async sendResetPasswordLink(data: { email: string }): Promise<any> {
    return this.post(`/auth/forgot-password/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Sets a new password using a reset token
   * @param {string} token - CSRF token for form submission security
   * @param {{ password: string }} data - Object containing the new password
   * @returns {Promise<any>} Response from the password update request
   * @throws {Error} Throws response data if the request fails
   */
  async setPassword(token: string, data: { password: string }): Promise<any> {
    return this.post(`/auth/set-password/`, data, {
      headers: {
        "X-CSRFTOKEN": token,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Generates a unique code for magic link authentication
   * @param {{ email: string }} data - Object containing the email address
   * @returns {Promise<any>} Response containing the generated unique code
   * @throws {Error} Throws response data if the request fails
   */
  async generateUniqueCode(data: { email: string }): Promise<any> {
    return this.post("/auth/magic-generate/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Performs user sign out by submitting a form with CSRF token
   * Creates and submits a form dynamically to handle the sign-out process
   * @param {string} baseUrl - Base URL for the sign-out endpoint
   * @returns {Promise<any>} Resolves when sign-out is complete
   * @throws {Error} Throws error if CSRF token is not found
   */
  async signOut(baseUrl: string): Promise<any> {
    await this.requestCSRFToken().then((data) => {
      const csrfToken = data?.csrf_token;

      if (!csrfToken) throw Error("CSRF token not found");

      const form = document.createElement("form");
      const element1 = document.createElement("input");

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
