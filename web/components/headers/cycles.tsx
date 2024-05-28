import { FC } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// ui
import { Breadcrumbs, Button, ContrastIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { CyclesViewHeader } from "@/components/cycles";
import { ProjectLogo } from "@/components/project";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUser } from "@/hooks/store";

export const CyclesHeader: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { toggleCreateCycleModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  const canUserCreateCycle =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs onBack={router.back}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={currentProjectDetails?.name ?? "Project"}
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                  icon={
                    currentProjectDetails && (
                      <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                        <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
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
