import { EUserWorkspaceRoles } from "constants/workspace";

export const getUserRole = (role: EUserWorkspaceRoles) => {
  switch (role) {
    case EUserWorkspaceRoles.GUEST:
      return "GUEST";
    case EUserWorkspaceRoles.VIEWER:
      return "VIEWER";
    case EUserWorkspaceRoles.MEMBER:
      return "MEMBER";
    case EUserWorkspaceRoles.ADMIN:
      return "ADMIN";
  }
};
