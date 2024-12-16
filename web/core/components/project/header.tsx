"use client";

import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Briefcase } from "lucide-react";
// ui
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useCommandPalette, useEventTracker, useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// components
import HeaderFilters from "./filters";
import { ProjectSearch } from "./search-projects";

export const ProjectsBaseHeader = observer(() => {
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
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
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={<BreadcrumbLink label="Projects" icon={<Briefcase className="h-4 w-4 text-custom-text-300" />} />}
          />
          {isArchived && <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label="Archived" />} />}
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
              setTrackElement("Projects page");
              toggleCreateProjectModal(true);
            }}
            className="items-center gap-1"
          >
            <span className="hidden sm:inline-block">Add</span> Project
          </Button>
        ) : (
          <></>
        )}
      </Header.RightItem>
    </Header>
  );
});
