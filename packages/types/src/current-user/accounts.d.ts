export type TCurrentUserAccount = {
  id: string | undefined;

  user: string | undefined;

  provider_account_id: string | undefined;
  provider: "google" | "github" | "gitlab" | string | undefined;
  access_token: string | undefined;
  access_token_expired_at: Date | undefined;
  refresh_token: string | undefined;
  refresh_token_expired_at: Date | undefined;
  last_connected_at: Date | undefined;
  metadata: object | undefined;

  created_at: Date | undefined;
  updated_at: Date | undefined;
};
