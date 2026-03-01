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
import { Stepper } from "@/components/importers/ui";
// plane web constants
import { IMPORTER_STEPS } from "@/constants/importers/flatfile";
// hooks
import { useFlatfileImporter } from "@/plane-web/hooks/store";
// types
import type { TImporterStepKeys } from "@/types/importers/flatfile";
import { E_IMPORTER_STEPS } from "@/types/importers/flatfile";
// step components
import { SelectPlaneProject } from "./select-plane-project";
import { ConfigureFlatfile } from "./configure-flatfile/root";

const STEP_COMPONENT_MAP: Record<TImporterStepKeys, () => React.ReactNode> = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: () => <SelectPlaneProject />,
  [E_IMPORTER_STEPS.CONFIGURE_FLATFILE]: () => <ConfigureFlatfile />,
};

export const StepsRoot = observer(function StepsRoot() {
  const { currentStepIndex, resetImporterData } = useFlatfileImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName="CSV Importer"
        logo={CSVLogo}
        steps={IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
        renderStep={(key) => STEP_COMPONENT_MAP[key]?.()}
      />
    </div>
  );
});
