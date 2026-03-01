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

import { useRef } from "react";
import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TBaseTemplateWithData } from "@plane/types";
// plane web imports
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { IBaseTemplateStore } from "@/store/templates";
// local imports
import { TemplateQuickActions } from "./quick-actions";

type TemplateListItemProps<T extends TBaseTemplateWithData> = {
  templateId: string;
  workspaceSlug: string;
  currentLevel: ETemplateLevel;
  selectedTemplateId: string | null;
  getTemplateById: IBaseTemplateStore<T>["getTemplateById"];
  deleteTemplate: (templateId: string) => Promise<void>;
  handleUseTemplateAction: () => void;
};

export const TemplateListItem = observer(function TemplateListItem<T extends TBaseTemplateWithData>(
  props: TemplateListItemProps<T>
) {
  const {
    templateId,
    workspaceSlug,
    currentLevel,
    selectedTemplateId,
    getTemplateById,
    deleteTemplate,
    handleUseTemplateAction,
  } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const template = getTemplateById(templateId);
  const workspace = getWorkspaceBySlug(workspaceSlug);

  if (!template || !workspace) return null;
  return (
    <div className="flex items-center justify-between gap-4 p-3 border border-subtle rounded-lg bg-layer-1">
      <div className="flex flex-col w-full truncate">
        <div className="text-body-xs-medium text-primary truncate">{template.name}</div>
        {template.short_description && (
          <div className="text-caption-sm-medium text-tertiary truncate">{template.short_description}</div>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        {currentLevel === ETemplateLevel.PROJECT && !template.project && (
          <span className="text-caption-sm-regular text-tertiary">
            {t("templates.settings.template_source.workspace.info")}
          </span>
        )}
        {currentLevel === ETemplateLevel.WORKSPACE && template.project && (
          <span className="text-caption-sm-regular text-tertiary">
            {t("templates.settings.template_source.project.info")}
          </span>
        )}
        <Button
          variant="secondary"
          className="focus:bg-layer-1-hover focus:text-secondary"
          onClick={handleUseTemplateAction}
          disabled={!!selectedTemplateId}
        >
          {selectedTemplateId === templateId
            ? t("templates.settings.use_template.button.loading")
            : t("templates.settings.use_template.button.default")}
          {selectedTemplateId === templateId && <Spinner className="size-3 animate-spin" />}
        </Button>
        <TemplateQuickActions
          templateId={templateId}
          workspaceSlug={workspaceSlug}
          parentRef={parentRef}
          getTemplateById={getTemplateById}
          deleteTemplate={deleteTemplate}
        />
      </div>
    </div>
  );
});
