import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { FileText } from "lucide-react";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// helpers
import { BreadcrumbLink, Logo } from "@/components/common";
// constants
import { EPageAccess } from "@/constants/page";
import { EUserProjectRoles } from "@/constants/project";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUser } from "@/hooks/store";

export const PagesHeader = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, type: pageType } = router.query;
  // store hooks
  const { toggleCreatePageModal } = useCommandPalette();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();
  const { setTrackElement } = useEventTracker();

  const canUserCreatePage =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div>
          <Breadcrumbs>
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
      </div>
      {canUserCreatePage && (
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
            Add Page
          </Button>
        </div>
      )}
    </div>
  );
});
