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

import { observer } from "mobx-react";

import { cn } from "@plane/utils";
import type { IProject } from "@plane/types";
import { useTranslation } from "@plane/i18n";

import { DefaultAutomationItemHeader } from "./automation-item-header";
import { FeatureFlagWrapper } from "./feature-flag";
import type { DefaultAutomation } from "./types";

type DefaultAutomationItemProps = {
  workspaceSlug: string;
  projectId: string;
  automation: DefaultAutomation;
  value: number;
  handleChange: (payload: Partial<IProject>) => void;
};

function AutomationItem(props: DefaultAutomationItemProps) {
  const { workspaceSlug, projectId, automation, value, handleChange } = props;

  const { t } = useTranslation();

  return (
    <div className="border border-subtle rounded-lg overflow-hidden relative">
      {/* header */}
      <div className="px-4 py-3">
        <DefaultAutomationItemHeader
          workspaceSlug={workspaceSlug}
          automation={automation}
          value={value}
          handleChange={handleChange}
        />
      </div>

      {/* content */}
      <FeatureFlagWrapper workspaceSlug={workspaceSlug} featureFlag={automation.feature_flag}>
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            value !== 0 ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="px-4 py-3 bg-layer-1 flex flex-col gap-2">
              {automation.content.map((content) => (
                <div key={content.type} className="flex items-center justify-between gap-2">
                  <div className="text-13 font-medium line-clamp-2 w-1/2 md:w-3/4">{t(content.i18n_name)}</div>
                  <div className="w-1/2 md:w-1/4">
                    <content.component
                      workspaceSlug={workspaceSlug}
                      projectId={projectId}
                      value={value}
                      handleChange={handleChange}
                      i18n_button_label={content.i18n_button_label ? t(content.i18n_button_label) : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FeatureFlagWrapper>
    </div>
  );
}

export const DefaultAutomationItem = observer(AutomationItem);
