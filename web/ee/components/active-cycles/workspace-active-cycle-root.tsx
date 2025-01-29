import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { IActiveCycle } from "@plane/types";
import { useFlag } from "@/plane-web/hooks/store";

export type ActiveCycleInfoCardProps = {
  cycle: IActiveCycle;
  workspaceSlug: string;
  projectId: string;
};

export const WorkspaceActiveCycleRoot = (props: ActiveCycleInfoCardProps) => {
  const { workspaceSlug, cycle } = props;
  const isFeatureEnabled = useFlag(workspaceSlug.toString(), "CYCLE_PROGRESS_CHARTS");
  const ActiveCycle = useMemo(
    () =>
      dynamic(
        () =>
          isFeatureEnabled
            ? import(`./card-v2`).then((module) => ({
                default: module["ActiveCycleInfoCard"],
              }))
            : import("./card-v1").then((module) => ({
                default: module["ActiveCycleInfoCard"],
              })),
        {
          // TODO: Add loading component
          loading: () => <></>,
        }
      ),
    [isFeatureEnabled]
  );

  return <ActiveCycle workspaceSlug={workspaceSlug?.toString()} projectId={cycle.project_id} cycle={cycle} />;
};
