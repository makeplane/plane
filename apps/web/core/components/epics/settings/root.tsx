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
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { Switch } from "@plane/propel/switch";
import { EWorkItemTypeEntity } from "@plane/types";
// components
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
// local imports
import { EpicsEmptyState } from "./empty-state";
import { EpicPropertiesRoot } from "./epics-properties";

export const EpicsRoot = observer(function EpicsRoot() {
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { getProjectEpicDetails, enableEpics, disableEpics, getProjectWorkItemPropertiesLoader } = useIssueTypes();
  const { getProjectById } = useProject();
  const { getProjectFeatures } = useProjectAdvanced();
  const { t } = useTranslation();
  // derived values
  const epicDetails = getProjectEpicDetails(projectId?.toString());
  const project = getProjectById(projectId?.toString());
  const projectFeatures = getProjectFeatures(projectId?.toString());
  const isEpicsEnabled = projectFeatures?.is_epic_enabled;

  const handleEnableDisableEpic = async () => {
    setIsLoading(true);

    const epicStatusPromise = isEpicsEnabled
      ? disableEpics(workspaceSlug?.toString(), projectId?.toString())
      : enableEpics(workspaceSlug?.toString(), projectId?.toString());
    if (!epicStatusPromise) return;
    setPromiseToast(epicStatusPromise, {
      loading: `${isEpicsEnabled ? "Disabling" : "Enabling"} ${epicDetails?.name} epic`,
      success: {
        title: "Success!",
        message: () => `Epic ${isEpicsEnabled ? "disabled" : "enabled"} successfully.`,
      },
      error: {
        title: "Error!",
        message: () =>
          `${epicDetails?.name} epic could not be ${isEpicsEnabled ? "disabled" : "enabled"}. Please try again.`,
      },
    });

    await epicStatusPromise;

    setIsLoading(false);
  };

  if (!isEpicsEnabled && project) {
    return <EpicsEmptyState workspaceSlug={workspaceSlug?.toString()} projectId={projectId?.toString()} />;
  }

  return (
    <div className="container mx-auto h-full pb-8">
      <div className="my-2 h-full overflow-y-scroll vertical-scrollbar scrollbar-sm">
        <div className="flex justify-between gap-2 pb-3.5 border-b border-subtle">
          <SettingsHeading
            title={t("project_settings.epics.heading")}
            description={t("project_settings.epics.description")}
            className="border-b-0 pb-0"
          />
          <div className="flex-shrink-0 flex items-center justify-center px-4">
            <Tooltip
              className="shadow"
              tooltipContent={isEpicsEnabled ? "Click to disable" : "Click to enable"}
              position="top"
            >
              <div>
                <Switch value={!!isEpicsEnabled} onChange={handleEnableDisableEpic} disabled={isLoading} />
              </div>
            </Tooltip>
          </div>
        </div>
        {epicDetails?.id && (
          <EpicPropertiesRoot
            epicId={epicDetails?.id}
            propertiesLoader={getProjectWorkItemPropertiesLoader(projectId?.toString(), EWorkItemTypeEntity.EPIC)}
            getWorkItemTypeById={useIssueType}
            containerClassName="py-7"
          />
        )}
      </div>
    </div>
  );
});
