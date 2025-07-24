"use client";

import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// plane web components
import {
  ConfigureClickUpSelectSpace,
  ConfigureClickUpSelectFolder,
  ConfigureClickUpSelectTeam,
} from "@/plane-web/components/importers/clickup";
import { StepperNavigation } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";
// plane web  types
import { E_CLICKUP_IMPORTER_STEPS, TImporterClickUpDataPayload } from "@/plane-web/types/importers/clickup";
import { PullAdditionalDataToggle } from "./pull-additional-data";

type TFormData = TImporterClickUpDataPayload[E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP];

const currentStepKey = E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP;

export const ConfigureClickUpRoot: FC = observer(() => {
  // hooks
  const { currentStep, handleStepper, importerData, handleImporterData } = useClickUpImporter();
  const { t } = useTranslation();

  // states
  const [formData, setFormData] = useState<TFormData>({
    spaceId: undefined,
    folderIds: [],
    teamId: undefined,
    pullAdditionalData: false,
  });

  // derived values
  const isNextButtonDisabled = !formData.spaceId || !formData.folderIds.length || !formData.teamId;

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
        <ConfigureClickUpSelectTeam
          value={formData.teamId}
          handleFormData={(value: string | undefined) => handleFormData("teamId", value)}
        />
        <ConfigureClickUpSelectSpace
          value={formData.spaceId}
          teamId={formData.teamId}
          handleFormData={(value: string | undefined) => handleFormData("spaceId", value)}
        />
        <ConfigureClickUpSelectFolder
          value={formData.folderIds}
          spaceId={formData.spaceId}
          handleFormData={(value: string[]) => handleFormData("folderIds", value)}
        />
        <PullAdditionalDataToggle
          pullAdditionData={formData.pullAdditionalData}
          handlePullAdditionalDataToggle={(value: boolean) => handleFormData("pullAdditionalData", value)}
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
