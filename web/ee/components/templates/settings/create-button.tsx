import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import {
  ETemplateLevel,
  ETemplateType,
  EUserPermissionsLevel,
  EUserProjectRoles,
  EUserWorkspaceRoles,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomMenu, Button, TButtonSizes } from "@plane/ui";
import {
  getCreateUpdateTemplateSettingsPath,
  getTemplateI18nLabel,
  TCreateTemplateSettingsPathProps,
} from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

type TCreateTemplatesButtonProps = {
  workspaceSlug: string;
  buttonI18nLabel?: string;
  buttonSize?: TButtonSizes;
} & (
  | {
      projectId: string;
      currentLevel: ETemplateLevel.PROJECT;
    }
  | {
      currentLevel: ETemplateLevel.WORKSPACE;
    }
);

type TCreateTemplateOption = {
  i18n_label: string;
  onClick: () => void;
  availableForLevels: ETemplateLevel[];
};

export const CreateTemplatesButton = observer((props: TCreateTemplatesButtonProps) => {
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const hasAdminPermission =
    props.currentLevel === ETemplateLevel.PROJECT
      ? allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT, props.workspaceSlug, props.projectId)
      : allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE, props.workspaceSlug);

  const CREATE_TEMPLATE_OPTIONS: TCreateTemplateOption[] = useMemo(() => {
    const getCreateTemplateSettingsPathProps = (type: ETemplateType) => {
      const createTemplatePathProps: TCreateTemplateSettingsPathProps = {
        type,
        workspaceSlug: props.workspaceSlug,
        ...("projectId" in props
          ? { level: ETemplateLevel.PROJECT, projectId: props.projectId }
          : { level: ETemplateLevel.WORKSPACE }),
      };
      return createTemplatePathProps;
    };

    return [
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.PROJECT),
        onClick: () =>
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PROJECT))),
        availableForLevels: [],
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.WORK_ITEM),
        onClick: () =>
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.WORK_ITEM))),
        availableForLevels: [ETemplateLevel.WORKSPACE, ETemplateLevel.PROJECT],
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.PAGE),
        onClick: () =>
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PAGE))),
        availableForLevels: [],
      },
    ];
  }, [router, props]);

  const getButtonLabel = useCallback(() => {
    if (!hasAdminPermission)
      return props.currentLevel === ETemplateLevel.PROJECT
        ? t("templates.settings.create_template.no_permission.project")
        : t("templates.settings.create_template.no_permission.workspace");

    return t(props.buttonI18nLabel || "templates.settings.create_template.label");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAdminPermission, props.buttonI18nLabel, props.currentLevel]);

  if (!hasAdminPermission) return null;
  return (
    <CustomMenu
      customButton={
        <Button
          variant="primary"
          size={props.buttonSize}
          className="flex items-center justify-center gap-1.5"
          disabled={!hasAdminPermission}
        >
          {getButtonLabel()}
          {hasAdminPermission && <ChevronDown className="size-3.5" />}
        </Button>
      }
      placement="bottom-end"
      disabled={!hasAdminPermission}
      closeOnSelect
    >
      {CREATE_TEMPLATE_OPTIONS.map((option) => {
        const isAvailable = option.availableForLevels.includes(props.currentLevel);
        if (!isAvailable) return null;
        return (
          <CustomMenu.MenuItem key={option.i18n_label} onClick={option.onClick} disabled={!isAvailable}>
            {t(option.i18n_label)}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
});
