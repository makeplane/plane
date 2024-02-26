import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// hooks
import { useApplication, useProject, useUser } from "hooks/store";
// components
import { Breadcrumbs, PhotoFilterIcon, Button } from "@plane/ui";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// constants
import { EUserProjectRoles } from "constants/project";

export const ProjectViewsHeader: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    commandPalette: { toggleCreateViewModal },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  const canUserCreateIssue =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <>
      <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <SidebarHamburgerToggle />
          <div>
            <Breadcrumbs>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                    label={currentProjectDetails?.name ?? "Project"}
                    icon={
                      currentProjectDetails?.emoji ? (
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded uppercase">
                          {renderEmoji(currentProjectDetails.emoji)}
                        </span>
                      ) : currentProjectDetails?.icon_prop ? (
                        <div className="grid h-7 w-7 flex-shrink-0 place-items-center">
                          {renderEmoji(currentProjectDetails.icon_prop)}
                        </div>
                      ) : (
                        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                          {currentProjectDetails?.name.charAt(0)}
                        </span>
                      )
                    }
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink label="Views" icon={<PhotoFilterIcon className="h-4 w-4 text-custom-text-300" />} />
                }
              />
            </Breadcrumbs>
          </div>
        </div>
        {canUserCreateIssue && (
          <div className="flex flex-shrink-0 items-center gap-2">
            <div>
              <Button
                variant="primary"
                size="sm"
                prependIcon={<Plus className="h-3.5 w-3.5 stroke-2" />}
                onClick={() => toggleCreateViewModal(true)}
              >
                Create View
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
});
