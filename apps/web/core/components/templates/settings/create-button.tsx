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
import { E_FEATURE_FLAGS, ETemplateLevel, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { ButtonProps } from "@plane/propel/button";
import { Button } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
import { ETemplateType, EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import type { TCreateTemplateSettingsPathProps } from "@plane/utils";
import { getCreateUpdateTemplateSettingsPath, getTemplateI18nLabel } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";

type TCreateTemplatesButtonProps = {
  workspaceSlug: string;
  buttonI18nLabel?: string;
  buttonSize?: NonNullable<ButtonProps["size"]>;
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

export const CreateTemplatesButton = observer(function CreateTemplatesButton(props: TCreateTemplatesButtonProps) {
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
        onClick: () => {
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PROJECT)));
        },
        availableForLevels: [ETemplateLevel.WORKSPACE],
        featureFlagKey: E_FEATURE_FLAGS.PROJECT_TEMPLATES,
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.WORK_ITEM),
        onClick: () => {
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.WORK_ITEM)));
        },
        availableForLevels: [ETemplateLevel.WORKSPACE, ETemplateLevel.PROJECT],
        featureFlagKey: E_FEATURE_FLAGS.WORKITEM_TEMPLATES,
      },
      {
        i18n_label: getTemplateI18nLabel(ETemplateType.PAGE),
        onClick: () => {
          router.push(getCreateUpdateTemplateSettingsPath(getCreateTemplateSettingsPathProps(ETemplateType.PAGE)));
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
          {hasAdminPermission && <ChevronDownIcon className="size-3.5" />}
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
