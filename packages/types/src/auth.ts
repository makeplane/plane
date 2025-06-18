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
