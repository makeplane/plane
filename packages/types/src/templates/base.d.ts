// plane imports
import { ETemplateType } from "@plane/constants";

export type TBaseTemplate<
  T extends ETemplateType = ETemplateType,
  D extends Record<string, unknown> = Record<string, unknown>,
> = {
  id: string;
  name: string;
  description_html: string | undefined;
  template_type: T;
  template_data: D;
  // workspace
  workspace: string;
  // project
  project: string | undefined;
  // timestamp
  created_at: string;
  updated_at: string;
};

export type TBaseTemplateWithData = TBaseTemplate<ETemplateType, Record<string, unknown>>;
