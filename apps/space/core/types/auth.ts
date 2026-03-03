/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export enum EAuthModes {
  SIGN_IN = "SIGN_IN",
  SIGN_UP = "SIGN_UP",
}

export enum EAuthSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
}

export interface ICsrfTokenData {
  csrf_token: string;
}

// email check types starts
export interface IEmailCheckData {
  email: string;
}

export interface IEmailCheckResponse {
  status: "MAGIC_CODE" | "CREDENTIAL";
  is_password_autoset: boolean;
  existing: boolean;
}
// email check types ends
