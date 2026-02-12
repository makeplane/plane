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

import { observer } from "mobx-react";
import { Stepper } from "@/components/importers/ui";
// plane web constants
import { NOTION_IMPORTER_STEPS, CONFLUENCE_IMPORTER_STEPS } from "@/constants/importers/notion";
import { useZipImporter } from "@/plane-web/hooks/store/importers/use-zip-importer";
import type { TZipImporterProps, TImporterStepKeys } from "@/types/importers/zip-importer";
import { E_IMPORTER_STEPS, EZipDriverType } from "@/types/importers/zip-importer";
// step components
import { SelectDestination } from "./select-destination";
import { UploadZip } from "./upload-zip";

export const StepsRoot = observer(function StepsRoot({ driverType, logo, serviceName }: TZipImporterProps) {
  const { currentStepIndex, resetImporterData } = useZipImporter(driverType);

  const renderStep = (key: TImporterStepKeys) => {
    switch (key) {
      case E_IMPORTER_STEPS.SELECT_DESTINATION:
        return <SelectDestination driverType={driverType} logo={logo} serviceName={serviceName} />;
      case E_IMPORTER_STEPS.UPLOAD_ZIP:
        return <UploadZip driverType={driverType} logo={logo} serviceName={serviceName} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName={serviceName}
        logo={logo}
        steps={driverType === EZipDriverType.NOTION ? NOTION_IMPORTER_STEPS : CONFLUENCE_IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
        renderStep={renderStep}
      />
    </div>
  );
});
