/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
// plane imports
import { Drawer, DrawerPanel } from "@makeplane/propel/components/drawer";
import { useTranslation } from "@plane/i18n";
// hooks
import { generateQueryParams } from "@plane/utils";
import { useCycle } from "@/hooks/store/use-cycle";
import { useAppRouter } from "@/hooks/use-app-router";
// components
import { CycleDetailsSidebar } from "./analytics-sidebar";

type Props = {
  projectId?: string;
  workspaceSlug: string;
  isArchived?: boolean;
};

export const CyclePeekOverview = observer(function CyclePeekOverview(props: Props) {
  const { projectId: propsProjectId, workspaceSlug, isArchived } = props;
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const peekCycle = searchParams.get("peekCycle");
  // plane hooks
  const { t } = useTranslation();
  // states
  const [drawerContainer, setDrawerContainer] = useState<HTMLDivElement | null>(null);
  // store hooks
  const { getCycleById, fetchCycleDetails, fetchArchivedCycleDetails } = useCycle();
  // derived values
  const cycleDetails = peekCycle ? getCycleById(peekCycle.toString()) : undefined;
  const projectId = propsProjectId || cycleDetails?.project_id;

  const handleClose = () => {
    const query = generateQueryParams(searchParams, ["peekCycle"]);
    router.push(`${pathname}?${query}`);
  };

  useEffect(() => {
    if (!peekCycle || !projectId) return;
    if (isArchived) fetchArchivedCycleDetails(workspaceSlug, projectId, peekCycle.toString());
    else fetchCycleDetails(workspaceSlug, projectId, peekCycle.toString());
  }, [fetchArchivedCycleDetails, fetchCycleDetails, isArchived, peekCycle, projectId, workspaceSlug]);

  return (
    <>
      {peekCycle && projectId && (
        // The drawer portals into this column so the peek still pushes the list instead of covering it.
        <div
          ref={setDrawerContainer}
          className="fixed right-0 z-[9] h-full w-full max-w-[358px] flex-shrink-0 md:relative"
        >
          {drawerContainer && (
            <Drawer
              open
              swipeDirection="right"
              onOpenChange={(open, eventDetails) => {
                if (open) return;
                // keep the peek open while the list and the sidebar's own dropdowns are used
                if (["escape-key", "close-press", "swipe"].includes(eventDetails.reason)) handleClose();
                else eventDetails.cancel();
              }}
            >
              <DrawerPanel
                variant="inline"
                side="end"
                size="sm"
                container={drawerContainer}
                aria-label={cycleDetails?.name ?? t("cycle.label", { count: 1 })}
              >
                <CycleDetailsSidebar
                  handleClose={handleClose}
                  isArchived={isArchived}
                  projectId={projectId}
                  workspaceSlug={workspaceSlug}
                  cycleId={peekCycle}
                />
              </DrawerPanel>
            </Drawer>
          )}
        </div>
      )}
    </>
  );
});
