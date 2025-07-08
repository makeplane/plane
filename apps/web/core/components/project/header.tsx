"use client";

import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Briefcase } from "lucide-react";
// i18n
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useCommandPalette, useUserPermissions } from "@/hooks/store";
// plane web constants
// components
import HeaderFilters from "./filters";
import { ProjectSearch } from "./search-projects";

export const ProjectsBaseHeader = observer(() => {
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  const pathname = usePathname();
  // auth
  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const isArchived = pathname.includes("/archives");

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("workspace_projects.label", { count: 2 })}
                icon={<Briefcase className="h-4 w-4 text-custom-text-300" />}
              />
            }
          />
          {isArchived && <Breadcrumbs.Item component={<BreadcrumbLink label="Archived" />} />}
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <ProjectSearch />
        <div className="hidden md:flex">
          <HeaderFilters />
        </div>
        {isAuthorizedUser && !isArchived ? (
          <Button
            size="sm"
            onClick={() => {
              toggleCreateProjectModal(true);
            }}
            data-ph-element={PROJECT_TRACKER_ELEMENTS.CREATE_HEADER_BUTTON}
            className="items-center gap-1"
          >
            <span className="hidden sm:inline-block">{t("workspace_projects.create.label")}</span>
            <span className="inline-block sm:hidden">{t("workspace_projects.label", { count: 1 })}</span>
          </Button>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
