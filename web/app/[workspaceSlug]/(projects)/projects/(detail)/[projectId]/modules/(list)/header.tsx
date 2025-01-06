"use client";

import { observer } from "mobx-react";
// ui
import { Breadcrumbs, Button, DiceIcon, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { ModuleViewHeader } from "@/components/modules";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web
import { ProjectBreadcrumb } from "@/plane-web/components/breadcrumbs";
// constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const ModulesListHeader: React.FC = observer(() => {
  // router
  const router = useAppRouter();
  // store hooks
  const { toggleCreateModuleModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  const {  loader } = useProject();

  // auth
  const canUserCreateModule = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs onBack={router.back} isLoading={loader}>
          <ProjectBreadcrumb />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Modules" icon={<DiceIcon className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      <Header.RightItem>
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
      </Header.RightItem>
    </Header>
  );
});
