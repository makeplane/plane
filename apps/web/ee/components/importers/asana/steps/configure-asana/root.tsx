"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
// ui
import { Button } from "@plane/ui";
// plane web components
import { ConfigureAsanaSelectWorkspace, ConfigureAsanaSelectProject } from "@/plane-web/components/importers/asana";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
// plane web types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/types/importers/asana";
import { useTranslation } from "@plane/i18n";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_ASANA];

const currentStepKey = E_IMPORTER_STEPS.CONFIGURE_ASANA;

export const ConfigureAsanaRoot: FC = observer(() => {
  // hooks
  const { importerData, handleImporterData, currentStep, handleStepper } = useAsanaImporter();
  const { t } = useTranslation();
  // states
  const [formData, setFormData] = useState<TFormData>({
    workspaceGid: undefined,
    projectGid: undefined,
  });
  // derived values
  const shouldShowProjectSelector = formData.workspaceGid;

  const isNextButtonDisabled = !formData?.workspaceGid || !formData?.projectGid;
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
      <div className="w-full min-h-44 max-h-full overflow-y-auto space-y-8">
        <ConfigureAsanaSelectWorkspace
          value={formData.workspaceGid}
          handleFormData={(value: string | undefined) => {
            handleFormData("workspaceGid", value);
            handleFormData("projectGid", undefined);
          }}
        />
        {shouldShowProjectSelector && (
          <ConfigureAsanaSelectProject
            workspaceGid={formData.workspaceGid}
            value={formData.projectGid}
            handleFormData={(value: string | undefined) => handleFormData("projectGid", value)}
          />
        )}
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
