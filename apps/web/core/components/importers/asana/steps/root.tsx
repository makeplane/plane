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
import AsanaLogo from "@/app/assets/services/asana.svg";
// plane web imports
import { Stepper } from "@/components/importers/ui";
import { IMPORTER_STEPS } from "@/constants/importers/asana";
import { useAsanaImporter } from "@/plane-web/hooks/store";
// types
import type { TImporterStepKeys } from "@/types/importers/asana";
import { E_IMPORTER_STEPS } from "@/types/importers/asana";
// step components
import { SelectPlaneProjectRoot } from "./select-plane-project";
import { ConfigureAsanaRoot } from "./configure-asana";
import { MapStatesRoot } from "./map-states";
import { MapPriorityRoot } from "./map-priority";
import { SummaryRoot } from "./summary";

const STEP_COMPONENT_MAP: Record<TImporterStepKeys, () => React.ReactNode> = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: () => <SelectPlaneProjectRoot />,
  [E_IMPORTER_STEPS.CONFIGURE_ASANA]: () => <ConfigureAsanaRoot />,
  [E_IMPORTER_STEPS.MAP_STATES]: () => <MapStatesRoot />,
  [E_IMPORTER_STEPS.MAP_PRIORITY]: () => <MapPriorityRoot />,
  [E_IMPORTER_STEPS.SUMMARY]: () => <SummaryRoot />,
};

export const StepsRoot = observer(function StepsRoot() {
  // hooks
  const { currentStepIndex, resetImporterData } = useAsanaImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName="Asana"
        logo={AsanaLogo}
        steps={IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
        renderStep={(key) => STEP_COMPONENT_MAP[key]?.()}
      />
    </div>
  );
});
