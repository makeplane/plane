export type TApplication = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description_html: string;
  description_stripped?: string;
  logo_asset?: string;
  logo_url?: string;
  company_name: string;
  published_at?: string;
  published_by?: string;
  publish_requested_at?: string;
  client_secret?: string;
  client_id?: string;
  redirect_uris: string;
  allowed_origins: string;
  webhook_url?: string;
  contact_email?: string;
  attachments: string[];
  categories: string[];
  attachments_urls: string[];
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  support_url?: string;
  setup_url?: string;
  configuration_url?: string;
  video_url?: string;
  created_at: string;
  is_mentionable: boolean;
  website?: string;
};

export type TUserApplication = TApplication & {
  is_owned: boolean;
  is_installed: boolean;
  installation_id?: string;
};

export type TApplicationOwner = {
  id: string;
  user: string;
  application: string;
  workspace: string;
};

export type TWorkspaceAppInstallation = {
  id: string;
  workspace: string;
  application: string;
  installed_by: string;
  app_bot: string;
  status: string;
};

export type TApplicationPublishDetails = {
  description_html: string;
  category: string;
  supported_languages: string;
  contact_email: string;
  privacy_policy_tnc_url: string;
  document_urls: string;
  photo_urls: string;
};

export type TApplicationCategory = {
  id: string;
  name: string;
  description: string;
};
