import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import {
  E_FEATURE_FLAGS,
  ETemplateLevel,
  EUserPermissionsLevel,
  PAGE_TEMPLATE_TRACKER_ELEMENTS,
  PROJECT_TEMPLATE_TRACKER_ELEMENTS,
  WORKITEM_TEMPLATE_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ETemplateType, EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
import { CustomMenu, Button, TButtonSizes } from "@plane/ui";
import {
  getCreateUpdateTemplateSettingsPath,
  getTemplateI18nLabel,
  TCreateTemplateSettingsPathProps,
} from "@plane/utils";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

type TCreateTemplatesButtonProps = {
  workspaceSlug: string;
  buttonI18nLabel?: string;
  buttonSize?: TButtonSizes;
  variant: "settings" | "empty_state";
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
  featureFlagKey: E_FEATURE_FLAGS;
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

    const getElementName = (type: ETemplateType) => {
      if (type === ETemplateType.PROJECT) {
        return props.variant === "settings"
          ? PROJECT_TEMPLATE_TRACKER_ELEMENTS.SETTINGS_PAGE_CREATE_BUTTON
          : PROJECT_TEMPLATE_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_BUTTON;
      }
      if (type === ETemplateType.WORK_ITEM) {
        if (props.variant === "settings") {
          return props.currentLevel === ETemplateLevel.WORKSPACE
            ? WORKITEM_TEMPLATE_TRACKER_ELEMENTS.WORKSPACE_SETTINGS_PAGE_CREATE_BUTTON
            : WORKITEM_TEMPLATE_TRACKER_ELEMENTS.PROJECT_SETTINGS_PAGE_CREATE_BUTTON;
        }
        return props.currentLevel === ETemplateLevel.WORKSPACE
          ? WORKITEM_TEMPLATE_TRACKER_ELEMENTS.WORKSPACE_EMPTY_STATE_CREATE_BUTTON
          : WORKITEM_TEMPLATE_TRACKER_ELEMENTS.PROJECT_EMPTY_STATE_CREATE_BUTTON;
      }
      if (type === ETemplateType.PAGE) {
        return props.variant === "settings"
          ? props.currentLevel === ETemplateLevel.WORKSPACE
            ? PAGE_TEMPLATE_TRACKER_ELEMENTS.WORKSPACE_SETTINGS_PAGE_CREATE_BUTTON
            : PAGE_TEMPLATE_TRACKER_ELEMENTS.PROJECT_SETTINGS_PAGE_CREATE_BUTTON
          : props.currentLevel === ETemplateLevel.WORKSPACE
            ? PAGE_TEMPLATE_TRACKER_ELEMENTS.WORKSPACE_EMPTY_STATE_CREATE_BUTTON
            : PAGE_TEMPLATE_TRACKER_ELEMENTS.PROJECT_EMPTY_STATE_CREATE_BUTTON;
      }
    };

    return [
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.PROJECT),
        onClick: () => {
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PROJECT)));
          const elementName = getElementName(ETemplateType.PROJECT);
          if (elementName) {
            captureClick({
              elementName,
            });
          }
        },
        availableForLevels: [ETemplateLevel.WORKSPACE],
        featureFlagKey: E_FEATURE_FLAGS.PROJECT_TEMPLATES,
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.WORK_ITEM),
        onClick: () => {
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.WORK_ITEM)));
          const elementName = getElementName(ETemplateType.WORK_ITEM);
          if (elementName) {
            captureClick({ elementName });
          }
        },
        availableForLevels: [ETemplateLevel.WORKSPACE, ETemplateLevel.PROJECT],
        featureFlagKey: E_FEATURE_FLAGS.WORKITEM_TEMPLATES,
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.PAGE),
        onClick: () => {
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PAGE)));
          const elementName = getElementName(ETemplateType.PAGE);
          if (elementName) {
            captureClick({ elementName });
          }
        },
        availableForLevels: [ETemplateLevel.WORKSPACE, ETemplateLevel.PROJECT],
        featureFlagKey: E_FEATURE_FLAGS.PAGE_TEMPLATES,
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
        const isFeatureFlagEnabled = useFlag(props.workspaceSlug, option.featureFlagKey);
        const isAvailable = option.availableForLevels.includes(props.currentLevel);
        if (!isAvailable || !isFeatureFlagEnabled) return null;
        return (
          <CustomMenu.MenuItem key={option.i18n_label} onClick={option.onClick} disabled={!isAvailable}>
            {t(option.i18n_label)}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
});
