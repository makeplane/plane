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
import JiraLogo from "@/app/assets/services/jira.svg?url";
// plane web components
import { Stepper } from "@/components/importers/ui";
// plane web constants
import { IMPORTER_STEPS } from "@/constants/importers";
// plane web hooks
import { useJiraImporter } from "@/plane-web/hooks/store";
// types
import type { TImporterStepKeys } from "@/types/importers/jira";
import { E_IMPORTER_STEPS } from "@/types/importers";
// step components
import { SelectPlaneProjectRoot } from "./select-plane-project";
import { ConfigureJiraRoot } from "./configure-jira";
import { ImportUsersFromJira } from "./import-users-from-jira";
import { MapStatesRoot } from "./map-states";
import { MapPriorityRoot } from "./map-priority";
import { SummaryRoot } from "./summary";

const STEP_COMPONENT_MAP: Record<TImporterStepKeys, () => React.ReactNode> = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: () => <SelectPlaneProjectRoot />,
  [E_IMPORTER_STEPS.CONFIGURE_JIRA]: () => <ConfigureJiraRoot />,
  [E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA]: () => <ImportUsersFromJira />,
  [E_IMPORTER_STEPS.MAP_STATES]: () => <MapStatesRoot />,
  [E_IMPORTER_STEPS.MAP_PRIORITY]: () => <MapPriorityRoot />,
  [E_IMPORTER_STEPS.SUMMARY]: () => <SummaryRoot />,
};

export const StepsRoot = observer(function StepsRoot() {
  // hooks
  const { currentStepIndex, resetImporterData } = useJiraImporter();

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Stepper
        serviceName="Jira"
        logo={JiraLogo}
        steps={IMPORTER_STEPS}
        currentStepIndex={currentStepIndex}
        redirectCallback={resetImporterData}
        renderStep={(key) => STEP_COMPONENT_MAP[key]?.()}
      />
    </div>
  );
});
