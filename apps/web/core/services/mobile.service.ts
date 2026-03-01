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

import type { AxiosInstance } from "axios";
import axios from "axios";
import { API_BASE_URL } from "@plane/constants";
import type {
  TMobileCSRFToken,
  TEmailCheckRequest,
  TEmailCheckResponse,
  TMobileUser,
  TMobileWorkspaceInvitation,
} from "@plane/types";

export class MobileAuthService {
  axiosInstance: AxiosInstance;
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
    });
  }

  requestCSRFToken = async (): Promise<TMobileCSRFToken> =>
    this.axiosInstance
      .get("/auth/get-csrf-token/")
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });

  emailCheck = async (data: TEmailCheckRequest): Promise<TEmailCheckResponse> =>
    this.axiosInstance
      .post("/auth/mobile/email-check/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  generateUniqueCode = async (data: { email: string }): Promise<void> =>
    this.axiosInstance
      .post("/auth/mobile/magic-generate/", data, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });

  currentUser = async (): Promise<TMobileUser> =>
    this.axiosInstance
      .get("/api/users/me/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });

  signOut = async (): Promise<void> =>
    this.axiosInstance
      .post("/auth/mobile/sign-out/", {})
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });

  // mobile workspace invitation
  fetchWorkspaceInvitation = async (data: {
    invitation_id: string;
    email: string;
  }): Promise<TMobileWorkspaceInvitation | undefined> =>
    this.axiosInstance
      .get(`/api/mobile/workspace-invitation/${data?.invitation_id}/${data?.email}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
}

const mobileAuthService = new MobileAuthService();

export default mobileAuthService;
