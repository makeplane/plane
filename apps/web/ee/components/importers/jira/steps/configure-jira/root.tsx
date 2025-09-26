"use client";

import { FC, useEffect, useState } from "react";
import { isEqual } from "lodash-es";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// plane web components
import { ConfigureJiraSelectResource, ConfigureJiraSelectProject } from "@/plane-web/components/importers/jira";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useJiraImporter } from "@/plane-web/hooks/store";
// plane web  types
import { E_IMPORTER_STEPS, TImporterDataPayload } from "@/plane-web/types/importers";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_JIRA];

const currentStepKey = E_IMPORTER_STEPS.CONFIGURE_JIRA;

export const ConfigureJiraRoot: FC = observer(() => {
  // hooks
  const { t } = useTranslation();
  const { currentStep, handleStepper, importerData, handleImporterData } = useJiraImporter();

  // states
  const [formData, setFormData] = useState<TFormData>({
    resourceId: undefined,
    projectId: undefined,
  });

  // derived values
  const shouldShowProjectSelector = formData.resourceId;
  const isNextButtonDisabled = !formData.resourceId || !formData?.projectId;

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
        {/* section handled jira workspace and projects */}
        <ConfigureJiraSelectResource
          value={formData.resourceId}
          handleFormData={(value: string | undefined) => handleFormData("resourceId", value)}
        />

        {shouldShowProjectSelector && (
          <ConfigureJiraSelectProject
            resourceId={formData.resourceId}
            value={formData.projectId}
            handleFormData={(value: string | undefined) => handleFormData("projectId", value)}
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
