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
