"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Breadcrumbs, Button, ContrastIcon, Header } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { CyclesViewHeader } from "@/components/cycles";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

export const CyclesListHeader: FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateCycleModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails, loader } = useProject();

  const canUserCreateCycle =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

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
      <Header.RightItem>
        {canUserCreateCycle && currentProjectDetails ? (
          <div className="flex items-center gap-3">
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
          </div>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
