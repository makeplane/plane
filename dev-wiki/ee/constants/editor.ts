// plane types
import { EUserPermissions, EUserProjectRoles } from "@plane/constants";
import { TSearchEntities } from "@plane/types";

export const EDITOR_MENTION_TYPES: TSearchEntities[] = ["user_mention"];
export const ROLE_PERMISSIONS_TO_CREATE_PAGE = [
  EUserPermissions.ADMIN,
  EUserPermissions.MEMBER,
  EUserProjectRoles.ADMIN,
  EUserProjectRoles.MEMBER,
];
