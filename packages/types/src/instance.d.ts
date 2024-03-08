import { IUserLite } from "./users";

export interface IInstance {
  id: string;
  namespace: string | undefined;
  instance_id: string | undefined;
  instance_name: string | undefined;
  license_key: string | undefined;
  api_key: string | undefined;
  version: string | undefined;
  last_checked_at: string | undefined;
  whitelist_emails: string | undefined;
  is_telemetry_enabled: boolean;
  is_support_required: boolean;
  is_activated: boolean;
  is_setup_done: boolean;
  is_signup_screen_visited: boolean;
  is_verified: boolean;
  user_count: number | undefined;
  created_at: string;
  updated_at: string;
  created_by: string | undefined;
  updated_by: string | undefined;
  config: {
    file_size_limit: number | undefined;
    github_app_name: string | undefined;
    has_openai_configured: boolean;
    has_unsplash_configured: boolean;
    is_github_enabled: boolean;
    is_google_enabled: boolean;
    is_smtp_configured: boolean;
    posthog_api_key: string | undefined;
    posthog_host: string | undefined;
    slack_client_id: string | undefined;
  };
}

export interface IInstanceConfiguration {
  id: string;
  created_at: string;
  updated_at: string;
  key: string;
  value: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface IFormattedInstanceConfiguration {
  [key: string]: string;
}

export interface IInstanceAdmin {
  created_at: string;
  created_by: string;
  id: string;
  instance: string;
  role: string;
  updated_at: string;
  updated_by: string;
  user: string;
  user_detail: IUserLite;
}
