export const EAuthModes = {
  SIGN_IN: "SIGN_IN",
  SIGN_UP: "SIGN_UP",
} as const;

export type EAuthModes = typeof EAuthModes[keyof typeof EAuthModes];

export const EAuthSteps = {
  EMAIL: "EMAIL",
  PASSWORD: "PASSWORD",
  UNIQUE_CODE: "UNIQUE_CODE",
} as const;

export type EAuthSteps = typeof EAuthSteps[keyof typeof EAuthSteps];

export interface ICsrfTokenData {
  csrf_token: string;
}

// email check types starts
export interface IEmailCheckData {
  email: string;
}

export interface IEmailCheckResponse {
  is_password_autoset: boolean;
  existing: boolean;
}
// email check types ends
