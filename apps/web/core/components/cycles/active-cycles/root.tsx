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
import { useFlag } from "@/plane-web/hooks/store";

type ProjectActiveCycleRootProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId?: string;
  showHeader?: boolean;
};

export function ProjectActiveCycleRoot(props: ProjectActiveCycleRootProps) {
  const { workspaceSlug, projectId, cycleId, showHeader = true } = props;
  // derived values
  const isFeatureEnabled = useFlag(workspaceSlug, "CYCLE_PROGRESS_CHARTS");

  const ActiveCycle = useMemo(
    function ActiveCycle() {
      return lazy(() =>
        isFeatureEnabled
          ? import(`./v2/root`).then((module) => ({
              default: module["ActiveCycleRoot"],
            }))
          : import("./v1/root").then((module) => ({
              default: module["ActiveCycleRoot"],
            }))
      );
    },
    [isFeatureEnabled]
  );

  return (
    <Suspense fallback={<></>}>
      <ActiveCycle workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} showHeader={showHeader} />
    </Suspense>
  );
}
