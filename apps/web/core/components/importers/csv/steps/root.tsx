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
// assets
import CSVLogo from "@/app/assets/services/csv.svg?url";
// plane web imports
import { Stepper } from "@/components/importers/ui/stepper";
// plane web constants
import { CSV_IMPORTER_STEPS } from "@/constants/importers/csv";
// hooks
import { useCSVImporter } from "@/plane-web/hooks/store";
// types
import type { TCSVImporterStepKeys } from "@/types/importers/csv";
import { E_CSV_IMPORTER_STEPS } from "@/types/importers/csv";
// step components
import { SelectPlaneProject } from "./select-plane-project";
import { UploadCSV } from "./upload-csv";

const STEP_COMPONENT_MAP: Record<TCSVImporterStepKeys, () => React.ReactNode> = {
  [E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: () => <SelectPlaneProject />,
  [E_CSV_IMPORTER_STEPS.UPLOAD_CSV]: () => <UploadCSV />,
};

/**
 * Steps root component for CSV importer.
 * Renders the stepper UI with navigation between import steps.
 */
export const CSVStepsRoot = observer(function CSVStepsRoot() {
  const { currentStepIndex, resetImporterData } = useCSVImporter();

  return (
    <div className="relative size-full overflow-hidden">
      <Stepper
        serviceName="CSV Importer"
        logo={CSVLogo}
        steps={CSV_IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
        renderStep={(key) => STEP_COMPONENT_MAP[key]?.()}
      />
    </div>
  );
});
