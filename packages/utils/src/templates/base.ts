import { ETemplateLevel, ETemplateType } from "@plane/constants";

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

export const getTemplateSettingsBasePath = (props: TBaseTemplateSettingsPathProps) => {
  const { level, workspaceSlug } = props;

  // get the base path
  let basePath = "";
  if (level === ETemplateLevel.WORKSPACE) {
    basePath = `/${workspaceSlug}/settings/templates`;
  } else if (level === ETemplateLevel.PROJECT && "projectId" in props) {
    basePath = `/${workspaceSlug}/projects/${props.projectId}/settings/templates`;
  }

  return basePath;
};

export type TCreateTemplateSettingsPathProps = TBaseTemplateSettingsPathProps & {
  type: ETemplateType;
};

export const getCreateTemplateSettingsPath = (props: TCreateTemplateSettingsPathProps) => {
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
