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
import LinearLogo from "@/app/assets/services/linear.svg?url";
// plane web components
import { Stepper } from "@/components/importers/ui";
// plane web constants
import { IMPORTER_LINEAR_STEPS } from "@/constants/importers/linear";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
// types
import type { TImporterLinearStepKeys } from "@/types/importers/linear";
import { E_LINEAR_IMPORTER_STEPS } from "@/types/importers/linear";
// step components
import { SelectPlaneProjectRoot } from "./select-plane-project";
import { ConfigureLinearRoot } from "./configure-linear";
import { MapStatesRoot } from "./map-states";
import { SummaryRoot } from "./summary";

const STEP_COMPONENT_MAP: Record<TImporterLinearStepKeys, () => React.ReactNode> = {
  [E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: () => <SelectPlaneProjectRoot />,
  [E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR]: () => <ConfigureLinearRoot />,
  [E_LINEAR_IMPORTER_STEPS.MAP_STATES]: () => <MapStatesRoot />,
  [E_LINEAR_IMPORTER_STEPS.SUMMARY]: () => <SummaryRoot />,
};

export const StepsRoot = observer(function StepsRoot() {
  // hooks
  const { currentStepIndex, resetImporterData } = useLinearImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName="Linear"
        logo={LinearLogo}
        steps={IMPORTER_LINEAR_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
        renderStep={(key) => STEP_COMPONENT_MAP[key]?.()}
      />
    </div>
  );
});
