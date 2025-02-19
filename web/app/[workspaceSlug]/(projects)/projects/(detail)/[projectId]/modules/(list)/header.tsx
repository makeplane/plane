"use client";

import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
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

export const ModulesListHeader: React.FC = observer(() => {
  // router
  const router = useAppRouter();
  // store hooks
  const { toggleCreateModuleModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  const { loader } = useProject();

  const { t } = useTranslation();

  // auth
  const canUserCreateModule = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
            <ProjectBreadcrumb />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink label={t("modules")} icon={<DiceIcon className="h-4 w-4 text-custom-text-300" />} />
              }
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
            <div className="sm:hidden block">{t("add")}</div>
            <div className="hidden sm:block">{t("project_module.add_module")}</div>
          </Button>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
