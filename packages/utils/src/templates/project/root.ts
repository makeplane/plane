// plane imports
import {
  ETemplateType,
  IUserLite,
  TProjectTemplate,
  TProjectTemplateForm,
  TProjectTemplateFormData,
  TWorkItemBlueprintFormData,
} from "@plane/types";
// local imports
import { extractTemplateBasicFormData } from "../base";
import { TWorkItemBlueprintFormDataListInvalid } from "../work-item/blueprint/sanitize";
import { buildProjectTemplateBlueprint, TBuildProjectTemplateBlueprintParams } from "./build";
import { extractProjectCreationFormData, extractProjectTemplateFormData } from "./extract";
import {
  TSanitizeProjectCreationFormParams,
  TSanitizeProjectTemplateFormDataParams,
  sanitizeProjectCreationFormData,
} from "./sanitize";

/**
 * Generic sanitization result for any project data
 * - 'valid' contains the sanitized data
 * - 'invalid' contains invalid IDs for each field
 */
export type TProjectSanitizationResult<T> = {
  valid: T;
  invalid: {
    [K in keyof T]?: T[K] extends string[] | null | undefined
      ? string[]
      : T[K] extends IUserLite | string | null | undefined
        ? string | null
        : T[K] extends Array<TWorkItemBlueprintFormData>
          ? TWorkItemBlueprintFormDataListInvalid<T[K]>
          : never;
  };
};

type TProjectTemplateDataToSanitizedFormDataParams = TSanitizeProjectTemplateFormDataParams & {
  template: TProjectTemplate;
};

export const projectTemplateDataToSanitizedFormData = async (
  params: TProjectTemplateDataToSanitizedFormDataParams
): Promise<{
  form: TProjectTemplateForm;
  invalidIds: TProjectSanitizationResult<TProjectTemplateFormData>["invalid"];
}> => {
  const { template } = params;

  const sanitizationResult = await extractAndSanitizeProjectTemplateFormData({
    ...params,
    projectData: template.template_data,
  });

  return {
    form: {
      template: extractTemplateBasicFormData(template),
      project: sanitizationResult.valid,
    },
    invalidIds: sanitizationResult.invalid,
  };
};

type TExtractAndSanitizeProjectCreationFormParams = TSanitizeProjectCreationFormParams & {
  projectData: TProjectTemplate["template_data"];
};

/**
 * Extracts and sanitizes project form data
 * Returns both valid data and invalid IDs for UI error handling
 */
export const extractAndSanitizeProjectCreationFormData = (params: TExtractAndSanitizeProjectCreationFormParams) => {
  const { projectData } = params;

  // Extract base project data first
  const extractedData = extractProjectCreationFormData({ projectData });

  // Sanitize the extracted data
  const sanitizedData = sanitizeProjectCreationFormData({
    ...params,
    extractedData,
    workspaceId: projectData.workspace,
  });

  return {
    valid: {
      ...extractedData,
      ...sanitizedData.valid,
    },
    invalid: sanitizedData.invalid,
  };
};

type TExtractAndSanitizeProjectFormDataParams = TSanitizeProjectTemplateFormDataParams & {
  projectData: TProjectTemplate["template_data"];
};

/**
 * Extracts and sanitizes project form data
 * Returns both valid data and invalid IDs for UI error handling
 */
const extractAndSanitizeProjectTemplateFormData = async (
  params: TExtractAndSanitizeProjectFormDataParams
): Promise<TProjectSanitizationResult<TProjectTemplateFormData>> => {
  const { projectData } = params;

  // Extract base project data first
  const extractedData = await extractProjectTemplateFormData({
    ...params,
    projectData,
  });

  const sanitizedData = sanitizeProjectCreationFormData({
    ...params,
    extractedData,
    workspaceId: projectData.workspace,
  });

  // Return both sanitized data and invalid IDs
  return {
    valid: {
      ...extractedData,
      ...sanitizedData.valid,
    },
    invalid: sanitizedData.invalid,
  };
};

type TProjectTemplateFormDataParams = {
  formData: TProjectTemplateForm;
} & TBuildProjectTemplateBlueprintParams;

/**
 * Converts form data back to the project template format
 */
export const projectTemplateFormDataToData = (params: TProjectTemplateFormDataParams): Partial<TProjectTemplate> => {
  const { formData, ...rest } = params;
  const { template, project } = formData;

  return {
    name: template.name,
    short_description: template.short_description,
    template_type: ETemplateType.PROJECT,
    template_data: buildProjectTemplateBlueprint({
      ...rest,
      project,
    }),
  };
};
