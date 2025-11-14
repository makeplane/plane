// plane imports
import { EUserPermissions } from "@plane/constants";
import type { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";

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

type TSupportedRole = EUserPermissions | EUserProjectRoles | EUserWorkspaceRoles;

/**
 * @description Returns the highest role from an array of supported roles
 * @param { TSupportedRole[] } roles
 * @returns { TSupportedRole | undefined }
 */
export const getHighestRole = <T extends TSupportedRole>(roles: T[]): T | undefined => {
  if (!roles || roles.length === 0) return undefined;
  return roles.reduce((highest, current) => (current > highest ? current : highest));
};
