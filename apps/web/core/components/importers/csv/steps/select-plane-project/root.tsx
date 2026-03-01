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

import { useEffect, useState } from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
import useSWR from "swr";
// types
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
// ui
import { Loader } from "@plane/ui";
// components
import { StepperNavigation } from "@/components/importers/ui/stepper";
import { Dropdown } from "@/components/importers/ui/dropdown";
// hooks
import { useCSVImporter } from "@/plane-web/hooks/store";
// types
import type { TCSVImporterDataPayload } from "@/types/importers/csv";
import { E_CSV_IMPORTER_STEPS } from "@/types/importers/csv";

type TFormData = TCSVImporterDataPayload[E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT];

const currentStepKey = E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT;

/**
 * Select Plane Project step for CSV importer.
 * Allows user to select which project to import work items into.
 */
export const SelectPlaneProject = observer(function SelectPlaneProject() {
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
  } = useCSVImporter();

  // states
  const [formData, setFormData] = useState<TFormData>({ projectId: undefined });

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const projects =
    workspaceSlug &&
    (projectIdsByWorkspaceSlug(workspaceSlug) || [])
      .map((id) => getProjectById(id))
      .filter((project) => project != undefined);
  const isNextButtonDisabled = !formData.projectId;

  // handlers
  const handleFormData = (value: string | undefined) => {
    setFormData({ projectId: value });
  };

  const handleOnClickNext = () => {
    // update the data in the context
    handleImporterData(currentStepKey, formData);
    // moving to the next state
    handleStepper("next");
  };

  useEffect(() => {
    const contextData = importerData[currentStepKey];
    if (contextData && !isEqual(contextData, formData)) {
      setFormData(contextData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importerData]);

  // fetching the plane projects
  const { isLoading } = useSWR(
    workspaceSlug ? `CSV_IMPORTER_PLANE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchProjects(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="relative size-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-2">
        <div className="text-body-sm-regular text-secondary">Select Plane project</div>
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
            placeHolder="Select plane project"
            onChange={(value: string | undefined) => handleFormData(value)}
            iconExtractor={(option) => (
              <div className="size-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                {option && option?.logo_props ? (
                  <Logo logo={option?.logo_props} size={14} />
                ) : (
                  <ProjectIcon className="size-4" />
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
            Next
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
