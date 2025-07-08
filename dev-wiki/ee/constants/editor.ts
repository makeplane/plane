// plane types
import { EUserPermissions } from "@plane/constants";
import { EUserProjectRoles, TSearchEntities } from "@plane/types";

export const EDITOR_MENTION_TYPES: TSearchEntities[] = ["user_mention"];
export const ROLE_PERMISSIONS_TO_CREATE_PAGE = [
  EUserPermissions.ADMIN,
  EUserPermissions.MEMBER,
  EUserProjectRoles.ADMIN,
  EUserProjectRoles.MEMBER,
];
