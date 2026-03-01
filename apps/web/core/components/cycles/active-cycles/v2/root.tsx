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

import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { useTranslation } from "@plane/i18n";
import { CycleProgressHeader } from "@/components/cycles/active-cycles/v2/progress-header";
// local imports
import { ActiveCycleDetails } from "./details";
import { useActiveCycleDetails } from "./use-active-cycle-details";

type ActiveCycleRootProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string;
  showHeader?: boolean;
};

export const ActiveCycleRoot = observer(function ActiveCycleRoot(props: ActiveCycleRootProps) {
  const { workspaceSlug, projectId, cycleId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const cycleDetails = useActiveCycleDetails({ workspaceSlug, projectId, cycleId });

  if (!cycleDetails.cycle || isEmpty(cycleDetails.cycle))
    return (
      <EmptyStateDetailed
        assetKey="cycle"
        title={t("project_cycles.empty_state.active.title")}
        description={t("project_cycles.empty_state.active.description")}
        rootClassName="py-10 h-auto"
      />
    );

  return (
    <>
      <div className="flex flex-shrink-0 flex-col border-b border-subtle-1">
        <div className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-subtle-1 bg-layer-1 cursor-pointer">
          <CycleProgressHeader
            cycleDetails={cycleDetails.cycle}
            progress={cycleDetails.cycleProgress}
            projectId={projectId}
            cycleId={cycleDetails.cycle?.id || "  "}
            workspaceSlug={workspaceSlug}
          />
        </div>
        <div>
          <ActiveCycleDetails {...cycleDetails} />
        </div>
      </div>
    </>
  );
});
