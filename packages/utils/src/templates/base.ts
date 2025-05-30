// plane imports
import { ETemplateLevel, ETemplateType } from "@plane/constants";
import { TBaseTemplateWithData } from "@plane/types";

/**
 * Gets the i18n name key for the template type
 * @param type - The type of the template
 * @returns The i18n name key for the template type
 */
export const getTemplateTypeI18nName = (type: ETemplateType) => {
  switch (type) {
    case ETemplateType.PROJECT:
      return "common.project";
    case ETemplateType.WORK_ITEM:
      return "common.work_item";
    case ETemplateType.PAGE:
      return "common.page";
  }
};

/**
 * Gets the i18n label key for the template type
 * @param type - The type of the template
 * @returns The i18n label key for the template type
 */
export const getTemplateI18nLabel = (type: ETemplateType) => {
  switch (type) {
    case ETemplateType.PROJECT:
      return "templates.settings.options.project.label";
    case ETemplateType.WORK_ITEM:
      return "templates.settings.options.work_item.label";
    case ETemplateType.PAGE:
      return "templates.settings.options.page.label";
  }
};

export type TBaseTemplateSettingsPathProps = {
  workspaceSlug: string;
} & (
  | {
      level: ETemplateLevel.WORKSPACE;
    }
  | {
      level: ETemplateLevel.PROJECT;
      projectId: string;
    }
);

/**
 * Gets the base path for the template settings page
 * @params workspaceSlug - The slug of the workspace
 * @params level - The level of the template (workspace or project)
 * @params projectId - The ID of the project (optional for workspace templates)
 * @returns The base path for the template settings page
 */
export const getTemplateSettingsBasePath = (props: TBaseTemplateSettingsPathProps) => {
  const { level, workspaceSlug } = props;

  // get the base path
  let basePath = "";
  if (level === ETemplateLevel.WORKSPACE) {
    basePath = `/${workspaceSlug}/settings/templates`;
  } else if (level === ETemplateLevel.PROJECT && "projectId" in props) {
    basePath = `/${workspaceSlug}/settings/projects/${props.projectId}/templates`;
  }

  return basePath;
};

export type TCreateTemplateSettingsPathProps = TBaseTemplateSettingsPathProps & {
  type: ETemplateType;
};

/**
 * Gets the path for the create/update template settings page
 * @param workspaceSlug - The slug of the workspace
 * @param type - The type of the template
 * @param level - The level of the template (workspace or project)
 * @param projectId - The ID of the project (optional for workspace templates)
 * @returns The path for the create/update template settings page
 */
export const getCreateUpdateTemplateSettingsPath = (props: TCreateTemplateSettingsPathProps) => {
  const { type, ...rest } = props;
  // get the base path
  const basePath = getTemplateSettingsBasePath(rest);

  // get the path for the type
  switch (type) {
    case ETemplateType.PROJECT:
      return `${basePath}/project`;
    case ETemplateType.WORK_ITEM:
      return `${basePath}/work-item`;
    case ETemplateType.PAGE:
      return `${basePath}/page`;
  }
};

export type TPublishTemplateSettingsPathProps = TCreateTemplateSettingsPathProps & {
  templateId: string;
};

/**
 * Gets the path for the publish template settings page
 * @param workspaceSlug - The slug of the workspace
 * @param type - The type of the template
 * @param level - The level of the template (workspace or project)
 * @param projectId - The ID of the project (optional for workspace templates)
 * @param templateId - The ID of the template
 * @returns The path for the publish template settings page
 */
export const getPublishTemplateSettingsPath = (props: TPublishTemplateSettingsPathProps) => {
  const createUpdateSettingsPath = getCreateUpdateTemplateSettingsPath(props);
  return `${createUpdateSettingsPath}/${props.templateId}/publish`;
};

/**
 * Extracts the basic template form data
 */
export const extractTemplateBasicFormData = (template: TBaseTemplateWithData) => ({
  id: template.id,
  name: template.name,
  short_description: template.short_description,
});
