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

import { useMemo } from "react";
import useSWR from "swr";
// types
import type { IActiveCycle } from "@plane/types";
import { Card } from "@plane/ui";
// services
import { CycleService } from "@/services/cycle.service";
// local imports
import { ActiveCyclePriorityIssues } from "./priority-issues";
import { ActiveCycleHeader } from "./header";
import { ActiveCyclesProjectTitle } from "./project-title";
import { ActiveCycleProgress } from "./progress";
import { ActiveCycleProductivity } from "./productivity";

const cycleService = new CycleService();

export type ActiveCycleInfoCardProps = {
  cycle: IActiveCycle;
  workspaceSlug: string;
  projectId: string;
};

export function ActiveCycleInfoCard(props: ActiveCycleInfoCardProps) {
  const { cycle, workspaceSlug, projectId } = props;

  const { data: progress } = useSWR(
    `PROJECTS_${cycle.project_detail.id}_PROGRESS_${cycle.id}`,
    workspaceSlug && cycle?.project_detail?.id && cycle?.id
      ? () => cycleService.workspaceActiveCyclesProgress(workspaceSlug.toString(), cycle.project_detail.id, cycle.id)
      : null,
    {
      revalidateOnFocus: false,
    }
  );

  const cycleData = useMemo(() => {
    const cycleDetails = {
      ...cycle,
      ...progress,
    };
    return cycleDetails;
  }, [progress, cycle]);

  return (
    <Card key={cycle.id}>
      <ActiveCyclesProjectTitle project={cycle.project_detail} />
      <ActiveCycleHeader cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <ActiveCycleProgress cycle={cycleData} />
        <ActiveCycleProductivity cycle={cycleData} workspaceSlug={workspaceSlug} />
        <ActiveCyclePriorityIssues cycle={cycle} workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>
    </Card>
  );
}
