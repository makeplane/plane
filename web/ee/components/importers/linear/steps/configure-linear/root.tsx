"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { Button } from "@plane/ui";
// plane web components
import { ConfigureLinearSelectTeam } from "@/plane-web/components/importers/linear";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
// plane web  types
import { E_LINEAR_IMPORTER_STEPS, TImporterLinearDataPayload } from "@/plane-web/types/importers/linear";
import { useTranslation } from "@plane/i18n";

type TFormData = TImporterLinearDataPayload[E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR];

const currentStepKey = E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR;

export const ConfigureLinearRoot: FC = observer(() => {
  // hooks
  const { currentStep, handleStepper, importerData, handleImporterData } = useLinearImporter();
  const { t } = useTranslation();

  // states
  const [formData, setFormData] = useState<TFormData>({
    teamId: undefined,
  });

  // derived values
  const isNextButtonDisabled = !formData.teamId;

  // handlers
  const handleFormData = <T extends keyof TFormData>(key: T, value: TFormData[T]) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const handleOnClickNext = () => {
    handleImporterData(currentStepKey, formData);
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
      <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-4">
        <ConfigureLinearSelectTeam
          value={formData.teamId}
          handleFormData={(value: string | undefined) => handleFormData("teamId", value)}
        />
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 relative flex items-center gap-2">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            {t("common.next")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
