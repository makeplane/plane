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

import type { FC } from "react";
import { useEffect, useState } from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import type { ExProject } from "@plane/sdk";
import type { IProject } from "@plane/types";
import { Loader } from "@plane/ui";
// components
// plane web components
import { StepperNavigation, Dropdown } from "@/components/importers/ui";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";
// plane web types
import type { TImporterClickUpDataPayload } from "@/types/importers/clickup";
import { E_CLICKUP_IMPORTER_STEPS } from "@/types/importers/clickup";

type TFormData = TImporterClickUpDataPayload[E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT];

const currentStepKey = E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT;

export const SelectPlaneProjectRoot = observer(function SelectPlaneProjectRoot() {
  // hooks
  const {
    workspace,
    fetchProjects,
    projectIdsByWorkspaceSlug,
    getProjectById,
    currentStep,
    handleStepper,
    importerData,
    handleImporterData,
    handleSyncJobConfig,
  } = useClickUpImporter();
  const { t } = useTranslation();

  // states
  const [formData, setFormData] = useState<TFormData>({ projectId: undefined });

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const projects =
    workspaceSlug &&
    ((projectIdsByWorkspaceSlug(workspaceSlug) || [])
      .map((id) => getProjectById(id))
      .filter((project) => project != undefined && !!project.member_role) as IProject[]);
  const isNextButtonDisabled = !formData.projectId;

  // handlers
  const handleFormData = (value: string | undefined) => {
    setFormData({ projectId: value });
    // updating the config data
    if (value) {
      const currentProject = getProjectById(value);
      if (currentProject) handleSyncJobConfig("planeProject", currentProject as ExProject);
    }
  };

  const handleOnClickNext = () => {
    // update the data in the context
    handleImporterData(currentStepKey, formData);
    // moving to the next state
    handleStepper("next");
  };

  // setting the form data from the store
  useEffect(() => {
    const contextData = importerData[currentStepKey];
    if (contextData && !isEqual(contextData, formData)) {
      setFormData(contextData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importerData]);

  // fetching the plane projects
  const { isLoading } = useSWR(
    workspaceSlug ? `IMPORTER_PLANE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? async () => fetchProjects(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-2">
        <div className="text-13 text-secondary">{t("importers.select_service_project", { serviceName: "Plane" })}</div>
        {isLoading && (!projects || projects.length === 0) ? (
          <Loader>
            <Loader.Item height="28px" width="100%" />
          </Loader>
        ) : (
          <Dropdown
            dropdownOptions={(projects || []).map((project) => ({
              key: project.id,
              label: project.name,
              value: project.id,
              data: project,
            }))}
            value={formData.projectId}
            placeHolder={t("importers.select_service_project", { serviceName: "Plane" })}
            onChange={(value: string | undefined) => handleFormData(value)}
            iconExtractor={(option) => (
              <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                {option && option?.logo_props ? (
                  <Logo logo={option?.logo_props} size={14} />
                ) : (
                  <ProjectIcon className="w-4 h-4" />
                )}
              </div>
            )}
            queryExtractor={(option) => option.name || ""}
          />
        )}
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            {t("common.next")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
