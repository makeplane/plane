/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { Loader } from "@plane/blocks/skeleton";
// local imports
import useCyclesDetails from "../active-cycle/use-cycles-details";
import { CycleAnalyticsProgress } from "./issue-progress";
import { CycleSidebarDetails } from "./sidebar-details";
import { CycleSidebarHeader } from "./sidebar-header";

type Props = {
  handleClose: () => void;
  isArchived?: boolean;
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
};

export const CycleDetailsSidebar = observer(function CycleDetailsSidebar(props: Props) {
  const { handleClose, isArchived, projectId, workspaceSlug, cycleId } = props;

  // store hooks
  const { cycle: cycleDetails } = useCyclesDetails({
    workspaceSlug,
    projectId,
    cycleId,
  });

  if (!cycleDetails)
    return (
      <Loader className="flex flex-col gap-6 py-6">
        <div className="flex flex-col gap-3">
          <Loader.Item height="20px" width="70%" />
          <Loader.Item height="24px" width="55%" />
        </div>
        <div className="flex flex-col gap-3">
          <Loader.Item height="28px" />
          <Loader.Item height="28px" />
          <Loader.Item height="28px" />
        </div>
      </Loader>
    );

  return (
    <div className="relative pb-2">
      <div className="flex w-full flex-col gap-6 pb-6">
        <CycleSidebarHeader
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          cycleDetails={cycleDetails}
          isArchived={isArchived}
          handleClose={handleClose}
        />
        <CycleSidebarDetails projectId={projectId} cycleDetails={cycleDetails} />
      </div>

      {workspaceSlug && projectId && cycleDetails?.id && (
        <CycleAnalyticsProgress workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleDetails?.id} />
      )}
    </div>
  );
});
