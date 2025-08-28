// plane imports
import {
  ETemplateType,
  TIssuePropertyValues,
  TWorkItemTemplate,
  TWorkItemTemplateForm,
  TWorkItemTemplateFormData,
} from "@plane/types";
// local imports
import { extractTemplateBasicFormData } from "../base";
import { TSanitizeWorkItemFormDataParams, TWorkItemSanitizationResult } from "./blueprint/sanitize";
import { buildWorkItemTemplateBlueprint, TBuildWorkItemTemplateBlueprintBaseParams } from "./build";
import { extractAndSanitizeWorkItemTemplateFormData } from "./extract";

export type TWorkItemTemplateDataToSanitizedFormDataParams = TSanitizeWorkItemFormDataParams & {
  template: TWorkItemTemplate;
};

/**
 * Converts a work item template to form data structure including invalid ID information
 * @param data - The work item template data
 * @returns The form data and invalid IDs
 */
export const workItemTemplateDataToSanitizedFormData = (
  data: TWorkItemTemplateDataToSanitizedFormDataParams
): { form: TWorkItemTemplateForm; invalidIds: TWorkItemSanitizationResult<TWorkItemTemplateFormData>["invalid"] } => {
  const sanitizationResult = extractAndSanitizeWorkItemTemplateFormData({
    ...data,
    workItemData: data.template.template_data,
  });

  return {
    form: {
      template: extractTemplateBasicFormData(data.template),
      work_item: sanitizationResult.valid,
    },
    invalidIds: sanitizationResult.invalid,
  };
};

/**
 * Parameters for converting form data back to the work item template format
 * @param formData - The form data
 * @param subWorkItemListCustomPropertyValues - The work item list custom property values
 * @param rest - The rest of the parameters
 */
type TWorkItemTemplateFormDataParams = {
  formData: TWorkItemTemplateForm;
  subWorkItemListCustomPropertyValues: Record<string, TIssuePropertyValues>;
} & TBuildWorkItemTemplateBlueprintBaseParams;

/**
 * Converts form data back to the work item template format
 * @param params - The parameters for converting form data back to the work item template format
 * @param params.formData - The form data
 * @param params.subWorkItemListCustomPropertyValues - The work item list custom property values
 * @param params.rest - The rest of the parameters
 * @returns The work item template data
 */
export const workItemTemplateFormDataToTemplate = (
  params: TWorkItemTemplateFormDataParams
): Partial<TWorkItemTemplate> => {
  const { formData, ...rest } = params;
  const { template, work_item } = formData;

  return {
    name: template.name,
    short_description: template.short_description,
    template_type: ETemplateType.WORK_ITEM,
    template_data: buildWorkItemTemplateBlueprint({
      workItem: work_item,
      ...{
        ...rest,
        subWorkItemListCustomPropertyValues: rest.subWorkItemListCustomPropertyValues || {},
      },
    }),
  };
};
