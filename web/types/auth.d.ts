export type TEmailCheckTypes = "magic_code" | "password";

export interface IEmailCheckData {
  email: string;
  type: TEmailCheckTypes;
}

export interface ILoginTokenResponse {
  access_token: string;
  refresh_toke: string;
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
