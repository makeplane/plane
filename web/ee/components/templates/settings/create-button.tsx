import { useMemo } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { ETemplateLevel, ETemplateType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomMenu, Button, TButtonSizes } from "@plane/ui";
import { getCreateTemplateSettingsPath, getTemplateI18nLabel, TCreateTemplateSettingsPathProps } from "@plane/utils";
// hooks
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
          router.push(getCreateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PROJECT))),
        availableForLevels: [],
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.WORK_ITEM),
        onClick: () =>
          router.push(getCreateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.WORK_ITEM))),
        availableForLevels: [ETemplateLevel.WORKSPACE, ETemplateLevel.PROJECT],
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.PAGE),
        onClick: () =>
          router.push(getCreateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PAGE))),
        availableForLevels: [],
      },
    ];
  }, [router, props]);

  return (
    <CustomMenu
      customButton={
        <Button variant="primary" size={props.buttonSize} className="flex items-center justify-center gap-1.5">
          {t(props.buttonI18nLabel || "templates.settings.create_template.label")}
          <ChevronDown className="size-3.5" />
        </Button>
      }
      placement="bottom-end"
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
