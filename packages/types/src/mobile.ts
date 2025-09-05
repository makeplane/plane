import { IInstanceConfig } from "./instance";
import { IUser } from "./users";
import { IWorkspaceMemberInvitation } from "./workspace";

// instance types
export type TInstanceConfig = IInstanceConfig;

// authentication types
export type TMobileCSRFToken = {
  csrf_token: string;
};

export type TEmailCheckRequest = {
  email: string;
};

export type TEmailCheckResponse = {
  status: "MAGIC_CODE" | "CREDENTIAL";
  existing: boolean;
  is_password_autoset: boolean;
};

// user types
export type TMobileUser = IUser;

// workspace invitation types
export type TMobileWorkspaceInvitation = Omit<IWorkspaceMemberInvitation, "invite_link" | "token">;
