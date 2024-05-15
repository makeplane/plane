import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// ui
import { Breadcrumbs, Button, DiceIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { ModuleViewHeader } from "@/components/modules";
import { ProjectLogo } from "@/components/project";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUser } from "@/hooks/store";

export const ModulesListHeader: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { toggleCreateModuleModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  // auth
  const canUserCreateModule =
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
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                        <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
                      </span>
                    )
                  }
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Modules" icon={<DiceIcon className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ModuleViewHeader />
        {canUserCreateModule && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTrackElement("Modules page");
              toggleCreateModuleModal(true);
            }}
          >
            <div className="hidden sm:block">Add</div> Module
          </Button>
        )}
      </div>
    </div>
  );
});
