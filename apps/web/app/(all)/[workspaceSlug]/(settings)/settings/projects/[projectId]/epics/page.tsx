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
// components
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane-web imports
import { EpicsRoot } from "@/components/epics/settings";
import { EpicsUpgrade } from "@/components/epics/upgrade";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
// local imports
import type { Route } from "./+types/page";
import { EpicsProjectSettingsHeader } from "./header";

function EpicsSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { currentProjectDetails } = useProject();
  // derived values
  const pageTitle = currentProjectDetails?.name ? `${currentProjectDetails?.name} - Epics` : undefined;

  return (
    <SettingsContentWrapper header={<EpicsProjectSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className={`w-full h-full overflow-hidden `}>
        <WithFeatureFlagHOC flag="EPICS" fallback={<EpicsUpgrade />} workspaceSlug={workspaceSlug}>
          <EpicsRoot />
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(EpicsSettingsPage);
