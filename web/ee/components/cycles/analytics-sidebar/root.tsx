"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import dynamic from "next/dynamic";
// hooks
import { useFlag } from "@/plane-web/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

export const SidebarChartRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, cycleId } = props;

  const isFeatureEnabled = useFlag(workspaceSlug.toString(), "CYCLE_PROGRESS_CHARTS");

  const SidebarChart = useMemo(
    () =>
      dynamic(
        () =>
          isFeatureEnabled
            ? import(`ee/components/cycles/analytics-sidebar/base`).then((module) => ({
                default: module["SidebarChart"],
              }))
            : import("@/ce/components/cycles/analytics-sidebar/base").then((module) => ({
                default: module["SidebarChart"],
              })),
        {
          // TODO: Add loading component
          loading: () => <></>,
        }
      ),
    [isFeatureEnabled]
  );

  return <SidebarChart workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleId} />;
});
