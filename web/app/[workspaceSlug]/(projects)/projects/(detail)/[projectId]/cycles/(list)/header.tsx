"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// ui
import { Breadcrumbs, Button, ContrastIcon, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { CyclesViewHeader } from "@/components/cycles";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";
// constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const CyclesListHeader: FC = observer(() => {
  // router
  const router = useAppRouter();
  // store hooks
  const { toggleCreateCycleModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails, loader } = useProject();

  const canUserCreateCycle = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back} isLoading={loader}>
          <ProjectBreadcrumb />
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={<BreadcrumbLink label="Cycles" icon={<ContrastIcon className="h-4 w-4 text-custom-text-300" />} />}
          />
        </Breadcrumbs>
      </Header.LeftItem>
      {canUserCreateCycle && currentProjectDetails ? (
        <Header.RightItem>
          <CyclesViewHeader projectId={currentProjectDetails.id} />
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTrackElement("Cycles page");
              toggleCreateCycleModal(true);
            }}
          >
            <div className="hidden sm:block">Add</div> Cycle
          </Button>
        </Header.RightItem>
      ) : (
        <></>
      )}
    </Header>
  );
});
