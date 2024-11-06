"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Loader } from "@plane/ui";
// components
import { CycleAnalyticsProgress, CycleSidebarHeader, CycleSidebarDetails } from "@/components/cycles";
// hooks
import useCyclesDetails from "../active-cycle/use-cycles-details";

type Props = {
  handleClose: () => void;
  isArchived?: boolean;
  cycleId?: string;
};

export const CycleDetailsSidebar: React.FC<Props> = observer((props) => {
  const { handleClose, isArchived } = props;
  // router
  const { workspaceSlug, projectId, cycleId } = useParams();

  // store hooks
  const { cycle: cycleDetails } = useCyclesDetails({
    workspaceSlug: workspaceSlug.toString(),
    projectId: projectId.toString(),
    cycleId: cycleId?.toString() || props.cycleId,
  });

  if (!cycleDetails)
    return (
      <Loader className="px-5">
        <div className="space-y-2">
          <Loader.Item height="15px" width="50%" />
          <Loader.Item height="15px" width="30%" />
        </div>
        <div className="mt-8 space-y-3">
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
          <Loader.Item height="30px" />
        </div>
      </Loader>
    );

  return (
    <div className="relative pb-2">
      <div className="flex flex-col gap-5 w-full">
        <CycleSidebarHeader
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          cycleDetails={cycleDetails}
          isArchived={isArchived}
          handleClose={handleClose}
        />
        <CycleSidebarDetails projectId={projectId.toString()} cycleDetails={cycleDetails} />
      </div>

      {workspaceSlug && projectId && cycleDetails?.id && (
        <CycleAnalyticsProgress
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          cycleId={cycleDetails?.id}
        />
      )}
    </div>
  );
});
