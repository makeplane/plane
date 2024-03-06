import { FC, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { List, Plus } from "lucide-react";
// hooks
// ui
import { Breadcrumbs, Button, ContrastIcon, CustomMenu } from "@plane/ui";
// helpers
// components
import { BreadcrumbLink } from "components/common";
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { CYCLE_VIEW_LAYOUTS } from "constants/cycle";
import { EUserProjectRoles } from "constants/project";
import { useApplication, useEventTracker, useProject, useUser } from "hooks/store";
import useLocalStorage from "hooks/use-local-storage";
import { TCycleLayout } from "@plane/types";
import { ProjectLogo } from "components/project";

export const CyclesHeader: FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    commandPalette: { toggleCreateCycleModal },
  } = useApplication();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentProjectDetails } = useProject();

  const canUserCreateCycle =
    currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole);

  const { setValue: setCycleLayout } = useLocalStorage<TCycleLayout>("cycle_layout", "list");

  const handleCurrentLayout = useCallback(
    (_layout: TCycleLayout) => {
      setCycleLayout(_layout);
    },
    [setCycleLayout]
  );

  return (
    <div className="relative z-10 items-center justify-between gap-x-2 gap-y-4">
      <div className="flex border-b border-custom-border-200 bg-custom-sidebar-background-100 p-4">
        <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
          <SidebarHamburgerToggle />
          <div>
            <Breadcrumbs onBack={router.back}>
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink
                    label={currentProjectDetails?.name ?? "Project"}
                    href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/issues`}
                    icon={
                      currentProjectDetails && (
                        <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                          <ProjectLogo logo={currentProjectDetails?.logo_props} className="text-sm" />
                        </span>
                      )
                    }
                  />
                }
              />
              <Breadcrumbs.BreadcrumbItem
                type="text"
                link={
                  <BreadcrumbLink label="Cycles" icon={<ContrastIcon className="h-4 w-4 text-custom-text-300" />} />
                }
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
                setTrackElement("Cycles page");
                toggleCreateCycleModal(true);
              }}
            >
              <div className="hidden sm:block">Add</div> Cycle
            </Button>
          </div>
        )}
      </div>
      <div className="flex justify-center sm:hidden">
        <CustomMenu
          maxHeight={"md"}
          className="flex flex-grow justify-center text-custom-text-200 text-sm py-2 border-b border-custom-border-200 bg-custom-sidebar-background-100"
          // placement="bottom-start"
          customButton={
            <span className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="flex flex-grow justify-center text-custom-text-200 text-sm">Layout</span>
            </span>
          }
          customButtonClassName="flex flex-grow justify-center items-center text-custom-text-200 text-sm"
          closeOnSelect
        >
          {CYCLE_VIEW_LAYOUTS.map((layout) => (
            <CustomMenu.MenuItem
              key={layout.key}
              onClick={() => {
                // handleLayoutChange(ISSUE_LAYOUTS[index].key);
                handleCurrentLayout(layout.key as TCycleLayout);
              }}
              className="flex items-center gap-2"
            >
              <layout.icon className="w-3 h-3" />
              <div className="text-custom-text-300">{layout.title}</div>
            </CustomMenu.MenuItem>
          ))}
        </CustomMenu>
      </div>
    </div>
  );
});
