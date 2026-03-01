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
// ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// plane web components
import { ConfigureAsanaSelectWorkspace, ConfigureAsanaSelectProject } from "@/components/importers/asana";
import { StepperNavigation } from "@/components/importers/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
// plane web types
import type { TImporterDataPayload } from "@/types/importers/asana";
import { E_IMPORTER_STEPS } from "@/types/importers/asana";

type TFormData = TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_ASANA];

const currentStepKey = E_IMPORTER_STEPS.CONFIGURE_ASANA;

export const ConfigureAsanaRoot = observer(function ConfigureAsanaRoot() {
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
          <Button variant="primary" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            {t("common.next")}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
