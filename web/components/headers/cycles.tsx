import { FC, useCallback } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { List, Plus } from "lucide-react";
// hooks
import { useApplication, useEventTracker, useProject, useUser } from "hooks/store";
// ui
import { Breadcrumbs, Button, ContrastIcon, CustomMenu } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
import { EUserProjectRoles } from "constants/project";
// components
import { SidebarHamburgerToggle } from "components/core/sidebar/sidebar-menu-hamburger-toggle";
import { BreadcrumbLink } from "components/common";
import { TCycleLayout } from "@plane/types";
import { CYCLE_VIEW_LAYOUTS } from "constants/cycle";
import useLocalStorage from "hooks/use-local-storage";

export const CyclesHeader: FC = observer(() => {
  // router
  const router = useRouter();
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

  const { workspaceSlug } = router.query as {
    workspaceSlug: string;
  };
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
