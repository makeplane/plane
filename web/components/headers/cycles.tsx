import { FC } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// hooks
import { useApplication, useProject, useUser } from "hooks/store";
// ui
import { Breadcrumbs, Button, ContrastIcon } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
import { EUserProjectRoles } from "constants/project";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";

export const CyclesHeader: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    commandPalette: { toggleCreateCycleModal },
    eventTracker: { setTrackElement },
  } = useApplication();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  const canUserCreateCycle =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <SidebarHamburgerToggle />
        <div>
          <Breadcrumbs>
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={
                <BreadcrumbLink
                  label={currentProjectDetails?.name ?? "Project"}
                  href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                  icon={
                    currentProjectDetails?.emoji ? (
                      renderEmoji(currentProjectDetails.emoji)
                    ) : currentProjectDetails?.icon_prop ? (
                      renderEmoji(currentProjectDetails.icon_prop)
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded bg-gray-700 uppercase text-white">
                        {currentProjectDetails?.name.charAt(0)}
                      </span>
                    )
                  }
                />
              }
            />
            <Breadcrumbs.BreadcrumbItem
              type="text"
              link={<BreadcrumbLink label="Cycles" icon={<ContrastIcon className="h-4 w-4 text-custom-text-300" />} />}
            />
          </Breadcrumbs>
        </div>
      </div>
      {canUserCreateCycle && (
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            prependIcon={<Plus />}
            onClick={() => {
              setTrackElement("CYCLES_PAGE_HEADER");
              toggleCreateCycleModal(true);
            }}
          >
            Add Cycle
          </Button>
        </div>
      )}
    </div>
  );
});
