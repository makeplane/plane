"use client";

import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
// ui
import { Breadcrumbs, Button, CustomHeader } from "@plane/ui";
// helpers
import { BreadcrumbLink, Logo } from "@/components/common";
// constants
import { EPageAccess } from "@/constants/page";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUser } from "@/hooks/store";

export const PagesListHeader = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const pageType = searchParams.get("type");
  // store hooks
  const { toggleCreatePageModal } = useCommandPalette();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails, loader } = useProject();
  const { setTrackElement } = useEventTracker();

  const canUserCreatePage =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <CustomHeader>
      <CustomHeader.LeftItem>
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
      </CustomHeader.LeftItem>
      <CustomHeader.RightItem>
        {canUserCreatePage ? (
          <div className="flex items-center gap-2">
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
          </div>
        ) : (
          <></>
        )}
      </CustomHeader.RightItem>
    </CustomHeader>
  );
});
