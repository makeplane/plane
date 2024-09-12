"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
// ui
import { Breadcrumbs, Button, Header } from "@plane/ui";
// helpers
import { BreadcrumbLink, Logo } from "@/components/common";
// constants
import { EPageAccess } from "@/constants/page";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

export const PagesListHeader = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const pageType = searchParams.get("type");
  // store hooks
  const { toggleCreatePageModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  const { currentProjectDetails, loader } = useProject();
  const { setTrackElement } = useEventTracker();

  const canUserCreatePage = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <div>
          <Breadcrumbs isLoading={loader}>
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
              link={<BreadcrumbLink label="Pages" icon={<FileText className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </Header.LeftItem>
      {canUserCreatePage ? (
        <Header.RightItem>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTrackElement("Project pages page");
              toggleCreatePageModal({
                isOpen: true,
                pageAccess: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
              });
            }}
          >
            Add page
          </Button>
        </Header.RightItem>
      ) : (
        <></>
      )}
    </Header>
  );
});
