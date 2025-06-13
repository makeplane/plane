export const EAuthenticationPageType = {
  STATIC: "STATIC",
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  AUTHENTICATED: "AUTHENTICATED",
} as const;

export type EAuthenticationPageType = typeof EAuthenticationPageType[keyof typeof EAuthenticationPageType];

export const EInstancePageType = {
  PRE_SETUP: "PRE_SETUP",
  POST_SETUP: "POST_SETUP",
} as const;

export type EInstancePageType = typeof EInstancePageType[keyof typeof EInstancePageType];

export const EUserStatus = {
  ERROR: "ERROR",
  AUTHENTICATION_NOT_DONE: "AUTHENTICATION_NOT_DONE",
  NOT_YET_READY: "NOT_YET_READY",
} as const;

export type EUserStatus = typeof EUserStatus[keyof typeof EUserStatus];

export type TUserStatus = {
  status: EUserStatus | undefined;
  message?: string;
};

export const EUserPermissionsLevel = {
  WORKSPACE: "WORKSPACE",
  PROJECT: "PROJECT",
} as const;

export type EUserPermissionsLevel = typeof EUserPermissionsLevel[keyof typeof EUserPermissionsLevel];

export const EUserWorkspaceRoles = {
  ADMIN: 20,
  MEMBER: 15,
  GUEST: 5,
} as const;

export type EUserWorkspaceRoles = typeof EUserWorkspaceRoles[keyof typeof EUserWorkspaceRoles];

export const EUserProjectRoles = {
  ADMIN: 20,
  MEMBER: 15,
  GUEST: 5,
} as const;

export type EUserProjectRoles = typeof EUserProjectRoles[keyof typeof EUserProjectRoles];

export type TUserPermissionsLevel = EUserPermissionsLevel;

export const EUserPermissions = {
  ADMIN: 20,
  MEMBER: 15,
  GUEST: 5,
} as const;

export type EUserPermissions = typeof EUserPermissions[keyof typeof EUserPermissions];
export type TUserPermissions = EUserPermissions;

export type TUserAllowedPermissionsObject = {
  create: TUserPermissions[];
  update: TUserPermissions[];
  delete: TUserPermissions[];
  read: TUserPermissions[];
};
export type TUserAllowedPermissions = {
  workspace: {
    [key: string]: Partial<TUserAllowedPermissionsObject>;
  };
  project: {
    [key: string]: Partial<TUserAllowedPermissionsObject>;
  };
};

export const USER_ALLOWED_PERMISSIONS: TUserAllowedPermissions = {
  workspace: {
    dashboard: {
      read: [
        EUserPermissions.ADMIN,
        EUserPermissions.MEMBER,
        EUserPermissions.GUEST,
      ],
    },
  },
  project: {},
};
