"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { Button } from "@plane/ui";
// silo components
import {
  ConfigureJiraSelectResource,
  ConfigureJiraSelectProject,
  ConfigureJiraSelectIssueType,
} from "@/plane-web/silo/jira/components";
// silo hooks
import { useImporter } from "@/plane-web/silo/jira/hooks";
// silo types
import { E_FORM_RADIO_DATA, E_IMPORTER_STEPS, TFormRadioData, TImporterDataPayload } from "@/plane-web/silo/jira/types";
// silo ui components
import { StepperNavigation } from "@/plane-web/silo/ui";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_JIRA];

const currentStepKey = E_IMPORTER_STEPS.CONFIGURE_JIRA;

export const ConfigureJiraRoot: FC = () => {
  // hooks
  const { importerData, handleImporterData, currentStep, handleStepper } = useImporter();
  // states
  const [formData, setFormData] = useState<TFormData>({
    resourceId: undefined,
    projectId: undefined,
    issueType: E_FORM_RADIO_DATA.CREATE_AS_LABEL,
  });
  // derived values
  const isNextButtonDisabled = !formData?.resourceId || !formData?.projectId || !formData?.issueType;
  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
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
      <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-8 divide-y divide-custom-border-100">
        {/* section handled jira workspace and projects */}
        <div className="space-y-4">
          <ConfigureJiraSelectResource
            value={formData.resourceId}
            handleFormData={(value: string | undefined) => handleFormData("resourceId", value)}
          />

          {formData.resourceId && (
            <ConfigureJiraSelectProject
              resourceId={formData.resourceId}
              value={formData.projectId}
              handleFormData={(value: string | undefined) => handleFormData("projectId", value)}
            />
          )}
        </div>

        {/* Managing issue types as labels or adding them in the issue title */}
        {formData.resourceId && formData.projectId && (
          <ConfigureJiraSelectIssueType
            value={formData.issueType}
            handleFormData={(value: TFormRadioData) => handleFormData("issueType", value)}
          />
        )}
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
