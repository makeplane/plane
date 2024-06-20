"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Breadcrumbs, Button, ContrastIcon } from "@plane/ui";
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
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
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
        </div>
      </div>
      {canUserCreateCycle && currentProjectDetails && (
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
      )}
    </div>
  );
});
