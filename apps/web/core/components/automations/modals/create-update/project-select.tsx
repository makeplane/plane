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

import { useState } from "react";
import { Plus } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { cn } from "@plane/utils";
// components
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  onChange: (value: string[]) => void;
  value: string[];
};

export const CreateUpdateAutomationModalProjectSelect = observer(function CreateUpdateAutomationModalProjectSelect(
  props: Props
) {
  const { onChange, value } = props;
  // states
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(value.length > 0);
  // store hooks
  const { getProjectById } = useProject();
  // translation
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-body-sm-medium">{t("automations.global_automations.project_select.label")}</p>
      <div className="mt-2 flex flex-col gap-y-2">
        <button
          type="button"
          className="bg-layer-1 hover:bg-layer-1-hover active:bg-layer-1-active border border-subtle p-2 flex gap-3 rounded-lg text-left"
          onClick={() => {
            onChange([]);
            setIsCollapsibleOpen(false);
          }}
        >
          <div className="shrink-0 py-1">
            <input type="radio" checked={value.length === 0 && !isCollapsibleOpen} />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-body-sm-medium">
              {t("automations.global_automations.project_select.all_projects.label")}
            </p>
            <p className="text-caption-md-regular text-tertiary">
              {t("automations.global_automations.project_select.all_projects.description")}
            </p>
          </div>
        </button>
        <button
          type="button"
          className={cn("bg-layer-1 border border-subtle p-2 flex gap-3 rounded-lg text-left cursor-pointer", {
            "cursor-default": isCollapsibleOpen,
            "hover:bg-layer-1-hover active:bg-layer-1-active": !isCollapsibleOpen,
          })}
          onClick={isCollapsibleOpen ? undefined : () => setIsCollapsibleOpen(true)}
        >
          <div className="shrink-0 py-1">
            <input type="radio" checked={value.length > 0 || isCollapsibleOpen} />
          </div>
          <div className="grow flex flex-col">
            <p className="text-body-sm-medium">
              {t("automations.global_automations.project_select.select_projects.label")}
            </p>
            <p className="text-caption-md-regular text-tertiary mt-0.5">
              {t("automations.global_automations.project_select.select_projects.description")}
            </p>
            {isCollapsibleOpen && (
              <div className="mt-2">
                <ProjectDropdown
                  value={value}
                  onChange={onChange}
                  button={
                    <span className="block min-h-8 text-left text-body-sm-regular text-placeholder px-3 py-1.5 bg-layer-2 hover:bg-layer-2-hover border border-subtle rounded-md">
                      {value.length > 0 ? (
                        <span className="flex items-center gap-2 flex-wrap">
                          {value.map((projectId) => {
                            const project = getProjectById(projectId);
                            return (
                              <span
                                key={projectId}
                                className="flex items-center gap-1 p-1 bg-layer-2 border border-subtle text-tertiary text-caption-sm-regular rounded-md"
                              >
                                <span className="shrink-0 size-3.5 grid place-items-center">
                                  <Logo logo={project?.logo_props} size={14} />
                                </span>
                                {project?.name}
                              </span>
                            );
                          })}
                        </span>
                      ) : (
                        <span className="flex items-center justify-between gap-2">
                          {t("automations.global_automations.project_select.select_projects.placeholder")}
                          <Plus className="shrink-0 size-4 text-icon-secondary" />
                        </span>
                      )}
                    </span>
                  }
                  buttonVariant="border-with-text"
                  multiple
                />
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
});
