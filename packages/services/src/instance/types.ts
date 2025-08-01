import * as z from "zod";

export const InstanceSchema = z.object({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  instance_name: z.string().optional(),
  whitelist_emails: z.string().optional(),
  instance_id: z.string().optional(),
  current_version: z.string().optional(),
  latest_version: z.string().optional(),
  last_checked_at: z.string().optional(),
  namespace: z.string().optional(),
  is_telemetry_enabled: z.boolean(),
  is_support_required: z.boolean(),
  is_activated: z.boolean(),
  is_setup_done: z.boolean(),
  is_signup_screen_visited: z.boolean(),
  user_count: z.number().optional(),
  is_verified: z.boolean(),
  workspaces_exist: z.boolean(),
});

export type TInstance = z.infer<typeof InstanceSchema>;

export const InstanceConfigSchema = z.object({
  enable_signup: z.boolean(),
  is_workspace_creation_disabled: z.boolean(),
  is_google_enabled: z.boolean(),
  is_github_enabled: z.boolean(),
  is_gitlab_enabled: z.boolean(),
  is_magic_login_enabled: z.boolean(),
  is_email_password_enabled: z.boolean(),
  github_app_name: z.string().optional(),
  slack_client_id: z.string().optional(),
  posthog_api_key: z.string().optional(),
  posthog_host: z.string().optional(),
  has_unsplash_configured: z.boolean(),
  has_llm_configured: z.boolean(),
  file_size_limit: z.number().optional(),
  is_smtp_configured: z.boolean(),
  app_base_url: z.string().optional(),
  space_base_url: z.string().optional(),
  admin_base_url: z.string().optional(),
  is_intercom_enabled: z.boolean(),
  intercom_app_id: z.string().optional(),
  instance_changelog_url: z.string().optional(),
});

export type TInstanceConfig = z.infer<typeof InstanceConfigSchema>;

export const InstanceResponseSchema = z.object({
  instance: InstanceSchema,
  config: InstanceConfigSchema,
});

export type TInstanceResponse = z.infer<typeof InstanceResponseSchema>;
