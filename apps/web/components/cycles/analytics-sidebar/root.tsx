/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { DrawerBody, DrawerHeader, DrawerHeaderActions } from "@makeplane/propel/components/drawer";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ArrowNarrowRightOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
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

  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { cycle: cycleDetails } = useCyclesDetails({
    workspaceSlug,
    projectId,
    cycleId,
  });

  return (
    <>
      <DrawerHeader>
        <DrawerHeaderActions side="start">
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={t("close")}
            onClick={() => handleClose()}
            icon={<Icon icon={ArrowNarrowRightOutline} />}
          />
        </DrawerHeaderActions>
      </DrawerHeader>
      {/* -mt-1 trims the drawer's 24px header gap to 20px so the cycle title sits closer to the close button. */}
      <DrawerBody render={<div className="vertical-scrollbar -mt-1 scrollbar-sm" />}>
        {cycleDetails ? (
          <div className="pb-2">
            <div className="flex w-full flex-col gap-6 pb-6">
              <CycleSidebarHeader
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                cycleDetails={cycleDetails}
                isArchived={isArchived}
              />
              <CycleSidebarDetails projectId={projectId} cycleDetails={cycleDetails} />
            </div>

            {workspaceSlug && projectId && cycleDetails?.id && (
              <CycleAnalyticsProgress workspaceSlug={workspaceSlug} projectId={projectId} cycleId={cycleDetails?.id} />
            )}
          </div>
        ) : (
          <Loader className="flex flex-col gap-6">
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
        )}
      </DrawerBody>
    </>
  );
});
