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

// types
import { observer } from "mobx-react";
import type { IActiveCycle } from "@plane/types";
// components
import { ActiveCycleDetails } from "@/components/cycles/active-cycles/v2/details";
import { useActiveCycleDetails } from "@/components/cycles/active-cycles/v2/use-active-cycle-details";
// local imports
import { ActiveCyclesProjectTitle } from "./project-title";
import { ActiveCycleHeader } from "./header";

export type ActiveCycleInfoCardProps = {
  cycle: IActiveCycle;
  workspaceSlug: string;
  projectId: string;
};

export const ActiveCycleInfoCard = observer(function ActiveCycleInfoCard(props: ActiveCycleInfoCardProps) {
  const { cycle, workspaceSlug, projectId } = props;
  const cycleDetails = useActiveCycleDetails({ workspaceSlug, projectId, cycleId: cycle.id, defaultCycle: cycle });
  return (
    <div key={cycle.id} className="flex flex-col gap-4 p-4 rounded-xl border border-subtle-1 bg-surface-1">
      <ActiveCyclesProjectTitle project={cycle.project_detail} />
      <ActiveCycleHeader cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
      <ActiveCycleDetails {...cycleDetails} />
    </div>
  );
});
