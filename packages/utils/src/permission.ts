import { EUserPermissions, EUserProjectRoles, EUserWorkspaceRoles } from "@plane/constants";

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
