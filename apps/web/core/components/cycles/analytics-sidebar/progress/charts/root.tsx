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
import { observer } from "mobx-react";
// hooks
import { useFlag } from "@/plane-web/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

export const SidebarChartRoot = observer(function SidebarChartRoot(props: Props) {
  const { workspaceSlug, projectId, cycleId } = props;

  const isFeatureEnabled = useFlag(workspaceSlug, "CYCLE_PROGRESS_CHARTS");

  const SidebarChart = useMemo(
    function SidebarChart() {
      return lazy(() =>
        isFeatureEnabled
          ? import(`./chart-v2`).then((module) => ({
              default: module["SidebarChart"],
            }))
          : import("./chart-v1").then((module) => ({
              default: module["SidebarChart"],
            }))
      );
    },
    [isFeatureEnabled]
  );

  return (
    <Suspense fallback={<></>}>
      <SidebarChart workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} />
    </Suspense>
  );
});
