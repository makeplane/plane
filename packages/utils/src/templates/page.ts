// plane imports
import { ETemplateType, TPageTemplate, TPageTemplateForm, TPageTemplateFormData } from "@plane/types";
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

type TBuildPageTemplateBlueprintParams = {
  workspaceId: string;
};

export type TBuildPageTemplateFormDataParams = {
  formData: TPageTemplateForm;
} & TBuildPageTemplateBlueprintParams;

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
    template_data: buildPageTemplateBlueprint({
      workspaceId,
      page,
    }),
  };
};

type TBuildPageTemplateDataParams = {
  page: TPageTemplateForm["page"];
} & TBuildPageTemplateBlueprintParams;

/**
 * Builds the page template blueprint
 */
const buildPageTemplateBlueprint = ({
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
