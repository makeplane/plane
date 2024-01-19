export interface IAppConfig {
  email_password_login: boolean;
  file_size_limit: number;
  google_client_id: string | null;
  github_app_name: string | null;
  github_client_id: string | null;
  oidc_auto: boolean;
  oidc_client_id: string | null;
  oidc_url_authorize: string | null;
  oidc_url_endsession: string | null;
  magic_login: boolean;
  slack_client_id: string | null;
  posthog_api_key: string | null;
  posthog_host: string | null;
  has_openai_configured: boolean;
  has_unsplash_configured: boolean;
  is_smtp_configured: boolean;
}
