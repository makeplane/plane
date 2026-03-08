/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TEmailCheckTypes = "magic_code" | "password";

export interface IEmailCheckData {
  email: string;
}

export interface IEmailCheckResponse {
  status: "MAGIC_CODE" | "CREDENTIAL";
  existing: boolean;
  is_password_autoset: boolean;
}

export interface ILoginTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface IMagicSignInData {
  email: string;
  key: string;
  token: string;
}

export interface IPasswordSignInData {
  email: string;
  password: string;
}

export interface ICsrfTokenData {
  csrf_token: string;
}
