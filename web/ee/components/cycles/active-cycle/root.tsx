import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { useFlag } from "@/plane-web/hooks/store";

interface IActiveCycleDetails {
  workspaceSlug: string;
  projectId: string;
}

export const ActiveCycleRoot = (props: IActiveCycleDetails) => {
  const { workspaceSlug, projectId } = props;
  const isFeatureEnabled = useFlag(workspaceSlug.toString(), "ACTIVE_CYCLE_PRO");
  const ActiveCycle = useMemo(
    () =>
      dynamic(
        () =>
          isFeatureEnabled
            ? import(`ee/components/cycles/active-cycle/base`).then((module) => ({
                default: module["ActiveCycleBase"],
              }))
            : import("ce/components/cycles/active-cycle/root").then((module) => ({
                default: module["ActiveCycleRoot"],
              })),
        {
          // TODO: Add loading component
          loading: () => <></>,
        }
      ),
    [isFeatureEnabled]
  );

  return <ActiveCycle workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />;
};
