// plane imports
import { ETemplateType } from "@plane/constants";
import { TBaseTemplate, TPage } from "@plane/types";

export type TPageTemplateData = Pick<TPage, "description_html" | "id" | "logo_props" | "name" | "workspace"> & {
  project: string | undefined;
};

export type TPageTemplate = TBaseTemplate<ETemplateType.PAGE, TPageTemplateData>;

export type TPageTemplateFormData = Pick<TPage, "description_html" | "id" | "logo_props" | "name"> & {
  project: string | undefined;
};

export type TPageTemplateForm = {
  template: Pick<TPageTemplate, "id" | "name" | "short_description">;
  page: TPageTemplateFormData;
};
