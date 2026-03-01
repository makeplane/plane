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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { Shapes } from "lucide-react";
import { PlusIcon } from "@plane/propel/icons";
// ui
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { ETemplateType } from "@plane/types";
import { CustomSearchSelect, Loader } from "@plane/ui";
// helpers
import { cn, getCreateUpdateTemplateSettingsPath } from "@plane/utils";
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useProjectTemplates } from "@/plane-web/hooks/store";

export type TProjectTemplateOptionTooltip = {
  [templateId: string]: string; // template id --> tooltip content
};

export type TProjectTemplateDropdownSize = "xs" | "sm";

type TProjectTemplateDropdownProps = {
  workspaceSlug: string;
  templateId: string | null;
  disabled?: boolean;
  size?: TProjectTemplateDropdownSize;
  placeholder?: string;
  optionTooltip?: TProjectTemplateOptionTooltip;
  buttonClassName?: string;
  customLabelContent?: React.ReactNode;
  showCreateNewTemplate?: boolean;
  handleTemplateChange: (value: string) => void;
  handleRedirection?: () => void;
};

export const ProjectTemplateDropdown = observer(function ProjectTemplateDropdown(props: TProjectTemplateDropdownProps) {
  const {
    workspaceSlug,
    templateId,
    disabled = false,
    size = "sm",
    placeholder,
    optionTooltip,
    buttonClassName,
    customLabelContent,
    showCreateNewTemplate = false,
    handleTemplateChange,
    handleRedirection,
  } = props;
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { loader, getAllTemplates, getTemplateById } = useProjectTemplates();
  // derived values
  const allProjectTemplates = getAllTemplates(workspaceSlug);
  const currentProjectTemplate = useMemo(
    () => (templateId ? getTemplateById(templateId) : undefined),
    [templateId, getTemplateById]
  );

  const projectTemplateOptions = useMemo(
    () =>
      allProjectTemplates.map((template) => ({
        value: template.id,
        query: template.name ?? "",
        content: (
          <div className="flex w-full gap-2 items-center text-secondary">
            <Shapes
              className={cn("flex-shrink-0", {
                "size-3": size === "xs",
                "size-4": size === "sm",
              })}
            />
            <div
              className={cn("truncate", {
                "text-caption-sm-regular": size === "xs",
                "text-body-xs-medium": size === "sm",
              })}
            >
              {template.name}
            </div>
          </div>
        ),
        tooltip: optionTooltip?.[template.id] ?? undefined,
      })),
    [allProjectTemplates, optionTooltip, size]
  );

  const redirectToCreateTemplatePage = () => {
    if (!showCreateNewTemplate) return;

    const createTemplateSettingsPath = getCreateUpdateTemplateSettingsPath({
      type: ETemplateType.PROJECT,
      workspaceSlug,
      level: ETemplateLevel.WORKSPACE,
    });

    router.push(createTemplateSettingsPath);
    handleRedirection?.();
  };

  if (loader === "init-loader") {
    return (
      <Loader className="w-16 h-full">
        <Loader.Item height="100%" />
      </Loader>
    );
  }

  return (
    <CustomSearchSelect
      value={templateId}
      customButton={
        <Button variant="secondary">
          {customLabelContent ? (
            customLabelContent
          ) : (
            <>
              <Shapes
                className={cn("flex-shrink-0", templateId ? "text-secondary" : "text-tertiary", {
                  "size-3": size === "xs",
                  "size-4": size === "sm",
                })}
              />
              {(currentProjectTemplate?.name || placeholder) && (
                <div
                  className={cn("truncate", templateId ? "text-secondary" : "text-tertiary", {
                    "text-caption-sm-regular": size === "xs",
                    "text-body-xs-medium": size === "sm",
                  })}
                >
                  {templateId ? currentProjectTemplate?.name : placeholder}
                </div>
              )}
            </>
          )}
        </Button>
      }
      options={projectTemplateOptions}
      onChange={handleTemplateChange}
      className="w-full h-full flex"
      optionsClassName="w-44 space-y-1.5"
      customButtonClassName={cn("rounded-sm text-body-xs-regular", buttonClassName)}
      disabled={disabled}
      noResultsMessage={t("templates.dropdown.no_results.project")}
      footerOption={
        showCreateNewTemplate ? (
          <Button
            variant="ghost"
            className="flex w-full justify-start items-center gap-1 px-1 py-1.5 rounded-sm text-caption-sm-medium text-secondary hover:bg-layer-transparent-hover"
            onClick={redirectToCreateTemplatePage}
          >
            <PlusIcon className="size-3.5" />
            {t("templates.dropdown.add.project")}
          </Button>
        ) : undefined
      }
      noChevron
    />
  );
});
