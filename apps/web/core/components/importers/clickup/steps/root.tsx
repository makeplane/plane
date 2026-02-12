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
import ClickUpLogo from "@/app/assets/services/clickup.svg?url";
// plane web components
import { Stepper } from "@/components/importers/ui";
// plane web constants
import { IMPORTER_CLICKUP_STEPS } from "@/constants/importers/clickup";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";
// types
import type { TClickUpImporterStepKeys } from "@/types/importers/clickup";
import { E_CLICKUP_IMPORTER_STEPS } from "@/types/importers/clickup";
// step components
import { ConfigureClickUpRoot } from "./configure-clickup";
import { MapStatesRoot } from "./map-states";
import { MapPriorityRoot } from "./map-priority";
import { SummaryRoot } from "./summary";

const STEP_COMPONENT_MAP: Partial<Record<TClickUpImporterStepKeys, () => React.ReactNode>> = {
  [E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP]: () => <ConfigureClickUpRoot />,
  [E_CLICKUP_IMPORTER_STEPS.MAP_STATES]: () => <MapStatesRoot />,
  [E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES]: () => <MapPriorityRoot />,
  [E_CLICKUP_IMPORTER_STEPS.SUMMARY]: () => <SummaryRoot />,
};

export const StepsRoot = observer(function StepsRoot() {
  // hooks
  const { currentStepIndex, resetImporterData } = useClickUpImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName="ClickUp"
        logo={ClickUpLogo}
        steps={IMPORTER_CLICKUP_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
        renderStep={(key) => STEP_COMPONENT_MAP[key]?.()}
      />
    </div>
  );
});
