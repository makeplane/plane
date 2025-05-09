// plane imports
import { ETemplateType } from "@plane/constants";
import { CompleteOrEmpty, TLogoProps } from "@plane/types";

export type TTemplateCategory = {
  id: string;
  name: string;
  description: string | undefined;
  logo_props: CompleteOrEmpty<TLogoProps>;
};

export type TTemplateAttachment = {
  id: string;
  template_id: string;
  file_asset_id: string;
};

export type TBaseTemplate<T extends ETemplateType, D extends Record<string, unknown> = Record<string, unknown>> = {
  id: string;
  name: string;
  short_description: string | undefined;
  template_type: T;
  template_data: D;
  // publish
  is_published: boolean;
  description_html: string | undefined;
  category_ids: Pick<TTemplateCategory, "id">[];
  company_name: string | undefined;
  attachment_ids: Pick<TTemplateAttachment, "id">[];
  // workspace
  workspace: string;
  // project
  project: string | undefined;
  // timestamp
  created_at: string;
  updated_at: string;
};

export type TBaseTemplateWithData = TBaseTemplate<ETemplateType, Record<string, unknown>>;
