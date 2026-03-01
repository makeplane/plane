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

import { lazy, Suspense, useMemo } from "react";
import type { IActiveCycle } from "@plane/types";
import { useFlag } from "@/plane-web/hooks/store";

export type WorkspaceActiveCycleCardProps = {
  cycle: IActiveCycle;
  projectId: string;
  workspaceSlug: string;
};

export function WorkspaceActiveCycleCard(props: WorkspaceActiveCycleCardProps) {
  const { workspaceSlug, cycle } = props;
  // derived values
  const isFeatureEnabled = useFlag(workspaceSlug.toString(), "CYCLE_PROGRESS_CHARTS");

  const ActiveCycle = useMemo(
    function ActiveCycle() {
      return lazy(() =>
        isFeatureEnabled
          ? import(`./card-v2`).then((module) => ({
              default: module["ActiveCycleInfoCard"],
            }))
          : import("./card-v1").then((module) => ({
              default: module["ActiveCycleInfoCard"],
            }))
      );
    },
    [isFeatureEnabled]
  );

  return (
    <Suspense fallback={<></>}>
      <ActiveCycle workspaceSlug={workspaceSlug?.toString()} projectId={cycle.project_id} cycle={cycle} />
    </Suspense>
  );
}
