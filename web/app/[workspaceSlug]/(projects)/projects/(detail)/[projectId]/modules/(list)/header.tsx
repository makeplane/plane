"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Breadcrumbs, Button, DiceIcon, CustomHeader } from "@plane/ui";
// components
import { BreadcrumbLink, Logo } from "@/components/common";
import { ModuleViewHeader } from "@/components/modules";
// constants
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

export const ModulesListHeader: React.FC = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleCreateModuleModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails, loader } = useProject();

  // auth
  const canUserCreateModule =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <CustomHeader>
      <CustomHeader.LeftItem>
        <div>
          <Breadcrumbs onBack={router.back} isLoading={loader}>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                  label={currentProjectDetails?.name ?? "Project"}
                  icon={
                    currentProjectDetails && (
                      <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                        <Logo logo={currentProjectDetails?.logo_props} size={16} />
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
      </CustomHeader.LeftItem>
      <CustomHeader.RightItem>
        <ModuleViewHeader />
        {canUserCreateModule ? (
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
        ) : (
          <></>
        )}
      </CustomHeader.RightItem>
    </CustomHeader>
  );
});
