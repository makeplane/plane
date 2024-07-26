import { EUserProjectRoles } from "@/constants/project";
import { EUserWorkspaceRoles } from "@/constants/workspace";

export const getUserRole = (role: EUserWorkspaceRoles | EUserProjectRoles) => {
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
