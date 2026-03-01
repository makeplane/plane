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
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import type { TPlacement } from "@plane/propel/utils";
import { ETemplateType } from "@plane/types";
import { CustomSearchSelect, Loader } from "@plane/ui";
// helpers
import { cn, getCreateUpdateTemplateSettingsPath } from "@plane/utils";
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useWorkItemTemplates } from "@/plane-web/hooks/store";

export type TWorkItemTemplateOptionTooltip = {
  [templateId: string]: string; // template id --> tooltip content
};

export type TWorkItemTemplateDropdownSize = "xs" | "sm";

type TWorkItemTemplateDropdownProps = {
  workspaceSlug: string;
  templateId: string | null;
  projectId: string;
  typeId: string | null;
  disabled?: boolean;
  size?: TWorkItemTemplateDropdownSize;
  placeholder?: string;
  optionTooltip?: TWorkItemTemplateOptionTooltip;
  buttonClassName?: string;
  customLabelContent?: React.ReactNode;
  tooltipPosition?: TPlacement;
  tooltipI18nContent?: string;
  handleTemplateChange: (value: string) => void;
  handleRedirection?: () => void;
} & (
  | {
      showCreateNewTemplate: true;
      level: ETemplateLevel;
    }
  | {
      showCreateNewTemplate: false;
    }
);

export const WorkItemTemplateDropdown = observer(function WorkItemTemplateDropdown(
  props: TWorkItemTemplateDropdownProps
) {
  const {
    workspaceSlug,
    templateId,
    projectId,
    typeId,
    disabled = false,
    size = "sm",
    placeholder,
    optionTooltip,
    buttonClassName,
    customLabelContent,
    showCreateNewTemplate,
    tooltipPosition = "right",
    tooltipI18nContent = "templates.dropdown.tooltip.work_item",
    handleTemplateChange,
    handleRedirection,
  } = props;
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { loader, getAllWorkItemTemplatesForProject, getAllWorkItemTemplatesForProjectByTypeId, getTemplateById } =
    useWorkItemTemplates();
  // derived values
  const allWorkItemTemplates = typeId
    ? getAllWorkItemTemplatesForProjectByTypeId(workspaceSlug, projectId, typeId)
    : getAllWorkItemTemplatesForProject(workspaceSlug, projectId);
  const currentWorkItemTemplate = useMemo(
    () => (templateId ? getTemplateById(templateId) : undefined),
    [templateId, getTemplateById]
  );

  const workItemTemplateOptions = useMemo(
    () =>
      allWorkItemTemplates.map((template) => ({
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
    [allWorkItemTemplates, optionTooltip, size]
  );

  const redirectToCreateTemplatePage = () => {
    if (!showCreateNewTemplate) return;

    const createTemplateSettingsPath = getCreateUpdateTemplateSettingsPath({
      type: ETemplateType.WORK_ITEM,
      workspaceSlug,
      ...(props.level === ETemplateLevel.PROJECT
        ? { level: ETemplateLevel.PROJECT, projectId }
        : { level: ETemplateLevel.WORKSPACE }),
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
        <Tooltip position={tooltipPosition} tooltipContent={t(tooltipI18nContent)}>
          <div
            className={cn("flex w-full items-center max-w-44 px-2 py-0.5", {
              "gap-1": size === "xs",
              "gap-2": size === "sm",
            })}
          >
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
                {(currentWorkItemTemplate?.name || placeholder) && (
                  <div
                    className={cn("truncate", templateId ? "text-secondary" : "text-tertiary", {
                      "text-caption-sm-regular": size === "xs",
                      "text-body-xs-medium": size === "sm",
                    })}
                  >
                    {templateId ? currentWorkItemTemplate?.name : placeholder}
                  </div>
                )}
              </>
            )}
          </div>
        </Tooltip>
      }
      options={workItemTemplateOptions}
      onChange={handleTemplateChange}
      className="w-full h-full flex"
      optionsClassName="w-44 space-y-1.5"
      customButtonClassName={cn("rounded-sm text-body-xs-regular  border border-subtle", buttonClassName)}
      disabled={disabled}
      noResultsMessage={t("templates.dropdown.no_results.work_item")}
      footerOption={
        showCreateNewTemplate ? (
          <Button
            variant="ghost"
            className="flex w-full justify-start items-center gap-1 px-1 py-1.5 rounded-sm text-caption-sm-medium text-secondary hover:bg-layer-transparent-hover"
            onClick={redirectToCreateTemplatePage}
          >
            <PlusIcon className="size-3.5" />
            {t("templates.dropdown.add.work_item")}
          </Button>
        ) : undefined
      }
      noChevron
    />
  );
});
