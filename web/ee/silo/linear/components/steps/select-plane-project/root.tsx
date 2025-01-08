"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { Briefcase } from "lucide-react";
import { ExProject } from "@plane/sdk";
import { Button } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// silo hooks
import { usePlaneProjects } from "@/plane-web/silo/hooks";
import { useImporter } from "@/plane-web/silo/linear/hooks";
// silo types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/silo/linear/types";
// silo ui components
import { StepperNavigation, Dropdown } from "@/plane-web/silo/ui";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.SELECT_PLANE_PROJECT];

const currentStepKey = E_IMPORTER_STEPS.SELECT_PLANE_PROJECT;

export const SelectPlaneProjectRoot: FC = () => {
  // hooks
  const { importerData, handleImporterData, handleSyncJobConfig, currentStep, handleStepper } = useImporter();
  const { data: projects, getById: getProjectById } = usePlaneProjects();
  // states
  const [formData, setFormData] = useState<TFormData>({ projectId: undefined });
  // derived values
  const isNextButtonDisabled = !formData.projectId;
  // handlers
  const handleFormData = (value: string | undefined) => {
    setFormData({ projectId: value });
    // updating the config data
    if (value) {
      const currentProject = getProjectById(value);
      console.log("currentProject", currentProject);
      // if (currentProject) handleSyncJobConfig("planeProject", currentProject as ExProject);
    }
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

  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto flex flex-col justify-between gap-4">
      {/* content */}
      <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-2">
        <div className="text-sm text-custom-text-200">Select Plane project</div>
        <Dropdown
          dropdownOptions={(projects || []).map((project) => ({
            key: project.id || "",
            label: project.name || "",
            value: project.id || "",
            data: project,
          }))}
          value={formData.projectId}
          placeHolder="Select plane project"
          onChange={(value: string | undefined) => handleFormData(value)}
          iconExtractor={(option) => (
            <div className="w-4.5 h-4.5 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
              {option && option?.logo_props ? (
                <Logo logo={option?.logo_props} size={14} />
              ) : (
                <Briefcase className="w-4 h-4" />
              )}
            </div>
          )}
          queryExtractor={(option) => option.name || ""}
        />
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            Next
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
};
