// plane imports
import { ETemplateType } from "@plane/constants";
import { TPageTemplate, TPageTemplateForm, TPageTemplateFormData } from "@plane/types";
// local imports
import { extractTemplateBasicFormData } from "./base";

export type TPageTemplateFormDataParams = unknown;

export type TPageTemplateDataToFormDataParams = TPageTemplateFormDataParams & {
  template: TPageTemplate;
};

/**
 * Extracts the template and form data from the template data
 */
export const pageTemplateDataToTemplateFormData = (params: TPageTemplateDataToFormDataParams): TPageTemplateForm => {
  const { template } = params;

  return {
    template: extractTemplateBasicFormData(template),
    page: extractPageFormData(template.template_data),
  };
};

/**
 * Extracts the form data from the template data
 */
export const extractPageFormData = (pageData: TPageTemplate["template_data"]): TPageTemplateFormData => ({
  id: pageData.id,
  name: pageData.name,
  description_html: pageData.description_html,
  logo_props: pageData.logo_props,
  project: pageData.project,
});

type TBuildPageTemplateSchemaParams = {
  workspaceId: string;
};

export type TBuildPageTemplateFormDataParams = {
  formData: TPageTemplateForm;
} & TBuildPageTemplateSchemaParams;

/**
 * Converts form data back to the page template format
 */
export const pageTemplateFormDataToData = ({
  workspaceId,
  formData,
}: TBuildPageTemplateFormDataParams): Partial<TPageTemplate> => {
  const { template, page } = formData;

  return {
    name: template.name,
    short_description: template.short_description,
    template_type: ETemplateType.PAGE,
    template_data: buildPageTemplateSchema({
      workspaceId,
      page,
    }),
  };
};

type TBuildPageTemplateDataParams = {
  page: TPageTemplateForm["page"];
} & TBuildPageTemplateSchemaParams;

/**
 * Builds the page template schema
 */
const buildPageTemplateSchema = ({
  workspaceId,
  page,
}: TBuildPageTemplateDataParams): TPageTemplate["template_data"] => ({
  id: page.id,
  name: page.name,
  description_html: page.description_html,
  logo_props: page.logo_props,
  project: page.project,
  workspace: workspaceId,
});
