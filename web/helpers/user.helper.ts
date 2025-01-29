import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/constants";
import { EUserPermissions } from "@/plane-web/constants/user-permissions";

export const getUserRole = (role: EUserPermissions | EUserWorkspaceRoles | EUserProjectRoles) => {
  switch (role) {
    case EUserPermissions.GUEST:
      return "GUEST";
    case EUserPermissions.MEMBER:
      return "MEMBER";
    case EUserPermissions.ADMIN:
      return "ADMIN";
  }
};
