/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// types
import { API_BASE_URL } from "@plane/constants";
import type { ICsrfTokenData, IEmailCheckData, IEmailCheckResponse } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class AuthService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async requestCSRFToken(): Promise<ICsrfTokenData> {
    const response = await this.get("/auth/get-csrf-token/");
    return response.data as ICsrfTokenData;
  }

  emailCheck = async (data: IEmailCheckData): Promise<IEmailCheckResponse> => {
    const response = await this.post("/auth/email-check/", data, { headers: {} });
    return response?.data as IEmailCheckResponse;
  };

  async sendResetPasswordLink(data: { email: string }): Promise<void> {
    await this.post(`/auth/forgot-password/`, data);
  }

  async setPassword(token: string, data: { password: string }): Promise<void> {
    await this.post(`/auth/set-password/`, data, {
      headers: {
        "X-CSRFTOKEN": token,
      },
    });
  }

  async generateUniqueCode(data: { email: string }): Promise<void> {
    await this.post("/auth/magic-generate/", data, { headers: {} });
  }

  async signOut(baseUrl: string): Promise<void> {
    // Check if running in desktop app
    const isDesktop = typeof window !== "undefined" && !!window.planeDesktop;

    if (isDesktop) {
      // For desktop app, use the desktop sign-out endpoint which returns JSON
      // This avoids redirect issues in Electron
      const csrfData = await this.requestCSRFToken();
      const csrfToken = csrfData?.csrf_token;

      if (!csrfToken) throw Error("CSRF token not found");

      await this.post(
        "/auth/desktop/sign-out/",
        {},
        {
          headers: {
            "X-CSRFTOKEN": csrfToken,
          },
        }
      );

      // Reload the page to show the login screen
      window.location.reload();
      return;
    }

    // For web, use the form-based approach with redirect
    const data = await this.requestCSRFToken();
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
  }
}
