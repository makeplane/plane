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
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// plane web components
import { ConfigureLinearSelectTeam } from "@/components/importers/linear";
import { StepperNavigation } from "@/components/importers/ui";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
// plane web  types
import type { TImporterLinearDataPayload } from "@/types/importers/linear";
import { E_LINEAR_IMPORTER_STEPS } from "@/types/importers/linear";

type TFormData = TImporterLinearDataPayload[E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR];

const currentStepKey = E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR;

export const ConfigureLinearRoot = observer(function ConfigureLinearRoot() {
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
          <Button variant="primary" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            {t("common.next")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
