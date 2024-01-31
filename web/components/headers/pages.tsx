import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { FileText, Plus } from "lucide-react";
// hooks
import { useApplication, useProject, useUser } from "hooks/store";
// ui
import { Breadcrumbs, Button } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// constants
import { EUserProjectRoles } from "constants/project";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";

export const PagesHeader = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    commandPalette: { toggleCreatePageModal },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  const canUserCreatePage =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <SidebarHamburgerToggle/>
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              label={currentProjectDetails?.name ?? "Project"}
              icon={
                currentProjectDetails?.emoji ? (
                  renderEmoji(currentProjectDetails.emoji)
                ) : currentProjectDetails?.icon_prop ? (
                  renderEmoji(currentProjectDetails.icon_prop)
                ) : (
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                    {currentProjectDetails?.name.charAt(0)}
                  </span>
                )
              }
              link={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              icon={<FileText className="h-4 w-4 text-custom-text-300" />}
              label="Pages"
            />
          </Breadcrumbs>
        </div>
      </div>
      {canUserCreatePage && (
        <div className="flex items-center gap-2">
          <Button variant="primary" prependIcon={<Plus />} size="sm" onClick={() => toggleCreatePageModal(true)}>
            Create Page
          </Button>
        </div>
      )}
    </div>
  );
});
