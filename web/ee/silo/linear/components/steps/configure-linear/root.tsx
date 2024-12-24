"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { Button } from "@plane/ui";
// silo components
import { ConfigureLinearSelectTeam } from "@/plane-web/silo/linear/components";
// silo hooks
import { useImporter } from "@/plane-web/silo/linear/hooks";
// silo types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/silo/linear/types";
// silo ui components
import { StepperNavigation } from "@/plane-web/silo/ui";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_LINEAR];

const currentStepKey = E_IMPORTER_STEPS.CONFIGURE_LINEAR;

export const ConfigureLinearRoot: FC = () => {
  // hooks
  const { importerData, handleImporterData, currentStep, handleStepper } = useImporter();
  // states
  const [formData, setFormData] = useState<TFormData>({
    teamId: undefined,
  });
  // derived values
  const isNextButtonDisabled = !formData?.teamId;
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
        <ConfigureLinearSelectTeam
          value={formData.teamId}
          handleFormData={(value: string | undefined) => handleFormData("teamId", value)}
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
