/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import { useTranslation } from "@plane/i18n";
import React from "react";
import { observer } from "mobx-react";
// plane imports
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
  const { t } = useTranslation();
  const { handleClose, isArchived, projectId, workspaceSlug, cycleId } = props;

  // store hooks
  const { cycle: cycleDetails } = useCyclesDetails({
    workspaceSlug,
    projectId,
    cycleId,
  });

  if (!cycleDetails)
    return (
      <Skeleton aria-label={t("aria_labels.loading.cycle_sidebar_details")}>
        <div className="px-5">
          <div className="space-y-2">
            <SkeletonItem blockSize="15px" inlineSize="50%" />
            <SkeletonItem blockSize="15px" inlineSize="30%" />
          </div>
          <div className="mt-8 space-y-3">
            <SkeletonItem blockSize="30px" />
            <SkeletonItem blockSize="30px" />
            <SkeletonItem blockSize="30px" />
          </div>
        </div>
      </Skeleton>
    );

  return (
    <div className="relative pb-2">
      <div className="flex w-full flex-col gap-5">
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
