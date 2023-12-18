export type TEmailCheckTypes = "magic_code" | "password";

export interface IEmailCheckData {
  email: string;
}

export interface IEmailCheckResponse {
  is_password_autoset: boolean;
  is_existing: boolean;
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
