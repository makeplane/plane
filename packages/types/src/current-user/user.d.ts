export type TCurrentUser = {
  id: string | undefined;
  avatar: string | undefined;
  cover_image: string | undefined;
  date_joined: Date | undefined;
  display_name: string | undefined;
  email: string | undefined;
  first_name: string | undefined;
  last_name: string | undefined;
  is_active: boolean;
  is_bot: boolean;
  is_email_verified: boolean;
  is_managed: boolean;
  mobile_number: string | undefined;
  user_timezone: string | undefined;
  username: string | undefined;
  is_password_autoset: boolean;
};

export type TCurrentUserSettings = {
  id: string | undefined;
  email: string | undefined;
  workspace: {
    last_workspace_id: string | undefined;
    last_workspace_slug: string | undefined;
    fallback_workspace_id: string | undefined;
    fallback_workspace_slug: string | undefined;
    invites: number | undefined;
  };
};
