"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { Breadcrumbs, Button, Header, InitiativeIcon } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useCommandPalette, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// Plane-web
import { HeaderFilters } from "@/plane-web/components/initiatives/header/filters";

export const InitiativesListHeader = observer(() => {
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const { toggleCreateInitiativeModal } = useCommandPalette();

  const { allowPermissions } = useUserPermissions();

  const { t } = useTranslation();

  const canUserCreateInitiative = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <>
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-2.5">
            <Breadcrumbs onBack={() => router.back()}>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={<BreadcrumbLink label={t("initiatives.label")} icon={<InitiativeIcon className="h-4 w-4" />} />}
              />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          <div className="hidden gap-3 md:flex">
            <HeaderFilters workspaceSlug={workspaceSlug.toString()} />
          </div>
          {canUserCreateInitiative ? (
            <Button onClick={() => toggleCreateInitiativeModal({ isOpen: true, initiativeId: undefined })} size="sm">
              <div className="hidden sm:block">{t("add")}</div> {t("initiatives.label")}
            </Button>
          ) : (
            <></>
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
