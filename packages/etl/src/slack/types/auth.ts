export type SlackAuthConfig = {
  clientId: string;
  clientSecret: string;
  user_redirect_uri: string;
  team_redirect_uri: string;
};

export type SlackAuthState = {
  profileRedirect?: boolean;
  userId: string;
  apiToken: string;
  workspaceId: string;
  workspaceSlug: string;
};

export type SlackUserAuthState = Omit<SlackAuthState, "apiToken"> & {
  apiToken?: string;
};

export type SlackBotTokenResponse = {
  ok: boolean;
  app_id: string;
  authed_user: {
    id: string;
  };
  scope: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
  bot_user_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise: null;
  is_enterprise_install: boolean;
};

export type SlackUserTokenResponse = {
  ok: boolean;
  app_id: string;
  // Sometimes the user info comes nested in authed_user object
  authed_user?: {
    id: string;
    scope?: string;
    access_token: string;
    refresh_token?: string;
    token_type?: string;
  };
  team?: {
    id: string;
    name: string;
  };
  enterprise?: null | any;
  is_enterprise_install?: boolean;
};

export type SlackTokenRefreshResponse = {
  ok: boolean;
  access_token: string;
  refresh_token: string;
  user_id?: string;
  bot_user_id?: string;
  token_type: string;
};

export type SlackAuthPayload = {
  state: SlackAuthState;
  code: string;
};

export type SlackUserAuthPayload = {
  state: SlackUserAuthState;
  code: string;
};

export function isSlackBotTokenResponse(
  response: SlackUserTokenResponse | SlackBotTokenResponse
): response is SlackBotTokenResponse {
  return "bot_user_id" in response;
}

export function isSlackUserTokenResponse(
  response: SlackUserTokenResponse | SlackBotTokenResponse
): response is SlackUserTokenResponse {
  if (!response.authed_user) {
    return false;
  }

  return "access_token" in response.authed_user;
}

export type SlackUserProfile = {
  title: string;
  phone: string;
  skype: string;
  real_name: string;
  real_name_normalized: string;
  display_name: string;
  display_name_normalized: string;
  fields: null | Record<string, any>; // Assuming fields can be null or an object
  status_text: string;
  status_emoji: string;
  status_emoji_display_info: any[]; // Assuming this is an array of objects
  status_expiration: number;
  avatar_hash: string;
  image_original: string;
  is_custom_image: boolean;
  email: string;
  first_name: string;
  last_name: string;
  image_24: string;
  image_32: string;
  image_48: string;
  image_72: string;
  image_192: string;
  image_512: string;
  image_1024: string;
  status_text_canonical: string;
  team: string;
};

export type SlackUser = {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: SlackUserProfile;
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  updated: number;
  is_email_confirmed: boolean;
  who_can_share_contact_card: string;
};

export type SlackUserResponse = {
  ok: boolean;
  user: SlackUser;
};

export type TSlackConnectionData = {
  id: string;
  name: string;
};

export type TAppConnection = {
  id: string;
  workspaceId: string;
  workspaceSlug: string;
  targetHostname: string;
  sourceHostname?: string | null;
  connectionType: string;
  connectionId: string;
  connectionData: TSlackConnectionData;
  config: object;
  createdAt: string;
  updatedAt: string;
};

export type TUserConnectionStatus = {
  isConnected: boolean;
};

export const E_SLACK_ENTITY_TYPE = {
  SLACK_PROJECT_UPDATES: "SLACK_PROJECT_UPDATES",
};

export enum E_SLACK_PROJECT_UPDATES_EVENTS {
  NEW_WORK_ITEM_CREATED = "NEW_WORK_ITEM_CREATED",
}

export type TSlackProjectUpdatesConfig = {
  events: E_SLACK_PROJECT_UPDATES_EVENTS[];
};
