/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { E_FEATURE_FLAGS, ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { ButtonProps } from "@plane/propel/button";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
import { ETemplateType } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import type { TCreateTemplateSettingsPathProps } from "@plane/utils";
import { getCreateUpdateTemplateSettingsPath, getTemplateI18nLabel } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useFlag, usePageTemplates, useWorkItemTemplates, useProjectTemplates } from "@/plane-web/hooks/store";

type TCreateTemplatesButtonProps = {
  workspaceSlug: string;
  buttonI18nLabel?: string;
  buttonSize?: NonNullable<ButtonProps["size"]>;
  variant: "settings" | "empty_state";
} & (
  | {
      projectId: string;
      level: ETemplateLevel.PROJECT;
    }
  | {
      level: ETemplateLevel.WORKSPACE;
    }
);

type TCreateTemplateOption = {
  i18n_label: string;
  onClick: () => void;
  availableForLevels: ETemplateLevel[];
  featureFlagKey: E_FEATURE_FLAGS;
  disabled?: boolean;
};

const CreateTemplateMenuItem = observer(function CreateTemplateMenuItem({
  option,
  workspaceSlug,
  currentLevel,
}: {
  option: TCreateTemplateOption;
  workspaceSlug: string;
  currentLevel: ETemplateLevel;
}) {
  const { t } = useTranslation();
  const isFeatureFlagEnabled = useFlag(workspaceSlug, option.featureFlagKey);
  const isAvailable = option.availableForLevels.includes(currentLevel);
  if (!isAvailable || !isFeatureFlagEnabled) return null;
  return (
    <CustomMenu.MenuItem key={option.i18n_label} onClick={option.onClick} disabled={!isAvailable}>
      {t(option.i18n_label)}
    </CustomMenu.MenuItem>
  );
});

export const CreateTemplatesButton = observer(function CreateTemplatesButton(props: TCreateTemplatesButtonProps) {
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getCanCreate: getCanCreateProjectTemplate } = useProjectTemplates();
  const { getCanCreate: getCanCreateWorkItemTemplate } = useWorkItemTemplates();
  const { getCanCreate: getCanCreatePageTemplate } = usePageTemplates();
  // derived values
  const canCreateProjectTemplate = getCanCreateProjectTemplate(props);
  const canCreateWorkItemTemplate = getCanCreateWorkItemTemplate(props);
  const canCreatePageTemplate = getCanCreatePageTemplate(props);
  const canCreateAnyTemplate = canCreateProjectTemplate || canCreateWorkItemTemplate || canCreatePageTemplate;

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
        onClick: () => {
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PROJECT)));
        },
        availableForLevels: [ETemplateLevel.WORKSPACE],
        featureFlagKey: E_FEATURE_FLAGS.PROJECT_TEMPLATES,
        disabled: !canCreateProjectTemplate,
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.WORK_ITEM),
        onClick: () => {
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.WORK_ITEM)));
        },
        availableForLevels: [ETemplateLevel.WORKSPACE, ETemplateLevel.PROJECT],
        featureFlagKey: E_FEATURE_FLAGS.WORKITEM_TEMPLATES,
        disabled: !canCreateWorkItemTemplate,
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.PAGE),
        onClick: () => {
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PAGE)));
        },
        availableForLevels: [ETemplateLevel.WORKSPACE, ETemplateLevel.PROJECT],
        featureFlagKey: E_FEATURE_FLAGS.PAGE_TEMPLATES,
        disabled: !canCreatePageTemplate,
      },
    ];
  }, [canCreateProjectTemplate, canCreateWorkItemTemplate, canCreatePageTemplate, props, router]);

  const getButtonLabel = useCallback(() => {
    if (!canCreateAnyTemplate)
      return props.level === ETemplateLevel.PROJECT
        ? t("templates.settings.create_template.no_permission.project")
        : t("templates.settings.create_template.no_permission.workspace");

    return t(props.buttonI18nLabel || "templates.settings.create_template.label");
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreateAnyTemplate, props.buttonI18nLabel, props.level]);

  if (!canCreateAnyTemplate) return null;
  return (
    <CustomMenu
      customButton={
        <Button
          variant="primary"
          size={props.buttonSize}
          className="flex items-center justify-center gap-1.5"
          disabled={!canCreateAnyTemplate}
        >
          {getButtonLabel()}
          {canCreateAnyTemplate && <ChevronDownIcon className="size-3.5" />}
        </Button>
      }
      placement="bottom-end"
      disabled={!canCreateAnyTemplate}
      closeOnSelect
    >
      {CREATE_TEMPLATE_OPTIONS.map((option) => (
        <CreateTemplateMenuItem
          key={option.i18n_label}
          option={option}
          workspaceSlug={props.workspaceSlug}
          currentLevel={props.level}
        />
      ))}
    </CustomMenu>
  );
});
