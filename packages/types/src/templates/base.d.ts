// plane imports
import { ETemplateType, TEMPLATE_KEYWORDS } from "@plane/constants";
import { CompleteOrEmpty, TLogoProps } from "@plane/types";

export type TTemplateCategory = {
  id: string;
  name: string;
  description: string | undefined;
  logo_props: CompleteOrEmpty<TLogoProps>;
  // timestamp
  created_at: string;
  updated_at: string;
};

export type TTemplateAttachment = {
  id: string;
  template_id: string;
  file_asset_id: string;
};

export type TTemplateKeywords = (typeof TEMPLATE_KEYWORDS)[number];

export type TBaseTemplate<T extends ETemplateType, D extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  name: string;
  short_description: string | undefined;
  template_type: T;
  template_data: D;
  // publish
  is_published: boolean;
  description_html: string | undefined;
  categories: string[];
  keywords: TTemplateKeywords[];
  company_name: string | undefined;
  contact_email: string | undefined;
  privacy_policy_url: string | undefined;
  terms_of_service_url: string | undefined;
  attachments: string[];
  attachments_urls: string[];
  // workspace
  workspace: string;
  // project
  project: string | undefined;
  // timestamp
  created_at: string;
  updated_at: string;
};

export type TBaseTemplateWithData = TBaseTemplate<ETemplateType, Record<string, unknown>>;

export type TPublishTemplateForm<T extends ETemplateType, D extends Record<string, unknown>> = Pick<
  TBaseTemplate<T, D>,
  | "id"
  | "name"
  | "short_description"
  | "description_html"
  | "categories"
  | "company_name"
  | "contact_email"
  | "keywords"
  | "privacy_policy_url"
  | "terms_of_service_url"
  | "attachments"
  | "attachments_urls"
>;

export type TPublishTemplateFormWithData = TPublishTemplateForm<ETemplateType, Record<string, unknown>>;
