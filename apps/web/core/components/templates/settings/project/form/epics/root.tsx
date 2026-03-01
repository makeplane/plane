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
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProjectTemplateForm } from "@plane/types";
import { Switch } from "@plane/propel/switch";
import { cn } from "@plane/utils";
// plane web imports
import { EpicPropertiesRoot } from "@/components/epics/settings/epics-properties";
import { TemplateCollapsibleWrapper } from "@/components/templates/settings/common";

export const ProjectEpicWorkItemType = observer(function ProjectEpicWorkItemType() {
  // plane hooks
  const { t } = useTranslation();
  // form context
  const { control, watch } = useFormContext<TProjectTemplateForm>();
  // derived values
  const projectEpic = watch("project.epics");

  if (!projectEpic || !projectEpic.id) return null;
  return (
    <>
      <TemplateCollapsibleWrapper
        title={t("epics.label")}
        actionElement={
          <div className="flex items-center">
            <Controller
              control={control}
              name="project.is_epic_enabled"
              render={({ field: { value, onChange } }) => (
                <Switch value={Boolean(value)} onChange={() => onChange(!value)} />
              )}
            />
          </div>
        }
        showBorder={false}
      >
        <EpicPropertiesRoot
          epicId={projectEpic.id}
          propertiesLoader={"loaded"}
          containerClassName="border-none"
          getWorkItemTypeById={() => projectEpic}
          getClassName={() => cn("bg-surface-1 hover:bg-surface-1 border border-subtle rounded-lg")}
        />
      </TemplateCollapsibleWrapper>
    </>
  );
});
