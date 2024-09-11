"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Breadcrumbs, Button, ContrastIcon, Header } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { CyclesViewHeader } from "@/components/cycles";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const CyclesListHeader: FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
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
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
                label={currentProjectDetails?.name ?? "Project"}
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                icon={
                  currentProjectDetails && (
                    <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                      <Logo logo={currentProjectDetails?.logo_props} size={16} />
                    </span>
                  )
                }
              />
            }
          />
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
